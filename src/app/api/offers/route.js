import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken, extractToken } from "@/lib/auth";
import { suggestNegotiationPrice, predictOfferAcceptance } from "@/lib/ai";

// GET /api/offers - Get user's offers
export async function GET(request) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = extractToken(authHeader);

    if (!token) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const user = await verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // 'sent' or 'received'
    const status = searchParams.get("status");

    let where = {};

    if (type === "sent") {
      where = { buyerId: user.id };
    } else if (type === "received") {
      // Get products owned by user (as seller)
      const sellerProducts = await prisma.product.findMany({
        where: { sellerId: user.id },
        select: { id: true },
      });
      const productIds = sellerProducts.map((p) => p.id);
      where = { productId: { in: productIds } };
    } else {
      // Get all offers related to user
      const buyerOffers = await prisma.offer.findMany({
        where: { buyerId: user.id },
        select: { id: true },
      });
      const buyerOfferIds = buyerOffers.map((o) => o.id);

      const sellerProducts = await prisma.product.findMany({
        where: { sellerId: user.id },
        select: { id: true },
      });
      const sellerProductIds = sellerProducts.map((p) => p.id);

      where = {
        OR: [{ buyerId: user.id }, { productId: { in: sellerProductIds } }],
      };
    }

    if (status) {
      where.status = status;
    }

    const offers = await prisma.offer.findMany({
      where,
      include: {
        product: {
          include: {
            category: true,
            seller: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        buyer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(offers);
  } catch (error) {
    console.error("Get offers error:", error);
    return NextResponse.json(
      { error: "Failed to fetch offers" },
      { status: 500 },
    );
  }
}

// POST /api/offers - Create a new offer
export async function POST(request) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = extractToken(authHeader);

    if (!token) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const user = await verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const body = await request.json();
    const { productId, initialOffer, message } = body;

    if (!productId || !initialOffer) {
      return NextResponse.json(
        { error: "Product ID and offer amount are required" },
        { status: 400 },
      );
    }

    // Get product details
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    if (!product.isNegotiable) {
      return NextResponse.json(
        { error: "This product is not negotiable" },
        { status: 400 },
      );
    }

    if (product.sellerId === user.id) {
      return NextResponse.json(
        { error: "You cannot make an offer on your own product" },
        { status: 400 },
      );
    }

    // Get AI suggestion for the offer
    const aiSuggestion = await suggestNegotiationPrice(
      product.price,
      initialOffer,
      { isNegotiable: product.isNegotiable, stock: product.stock },
    );

    // Get acceptance prediction
    const prediction = await predictOfferAcceptance(
      initialOffer,
      product.price,
      { isNegotiable: product.isNegotiable, stock: product.stock },
    );

    // Check for existing pending offer
    const existingOffer = await prisma.offer.findFirst({
      where: {
        buyerId: user.id,
        productId,
        status: "PENDING",
      },
    });

    if (existingOffer) {
      return NextResponse.json(
        { error: "You already have a pending offer for this product" },
        { status: 409 },
      );
    }

    // Create offer
    const offer = await prisma.offer.create({
      data: {
        buyerId: user.id,
        productId,
        initialOffer,
        message,
        aiSuggestedPrice: aiSuggestion.suggestedPrice,
        aiConfidence: aiSuggestion.confidence,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
      include: {
        product: true,
        buyer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        ...offer,
        aiSuggestion,
        prediction,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Create offer error:", error);
    return NextResponse.json(
      { error: "Failed to create offer" },
      { status: 500 },
    );
  }
}

// PUT /api/offers - Update offer status (accept, reject, counter)
export async function PUT(request) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = extractToken(authHeader);

    if (!token) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const user = await verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const body = await request.json();
    const { offerId, action, counterOffer, message } = body;

    // Get offer
    const offer = await prisma.offer.findUnique({
      where: { id: offerId },
      include: { product: true },
    });

    if (!offer) {
      return NextResponse.json({ error: "Offer not found" }, { status: 404 });
    }

    // Verify authorization: either buyer or seller can respond to offer
    const isSeller = offer.product.sellerId === user.id;
    const isBuyer = offer.buyerId === user.id;

    // Either buyer or seller must be the one responding
    if (!isSeller && !isBuyer) {
      return NextResponse.json(
        { error: "Not authorized to respond to this offer" },
        { status: 403 },
      );
    }

    if (action === "accept_counter") {
      // Only buyer can accept a counter offer
      if (!isBuyer) {
        return NextResponse.json(
          { error: "Not authorized to accept this counter offer" },
          { status: 403 },
        );
      }
      if (offer.status !== "COUNTERED") {
        return NextResponse.json(
          { error: "This offer has not been countered" },
          { status: 400 },
        );
      }
    } else if (["accept", "reject", "counter"].includes(action)) {
      // Check appropriate status - PENDING or COUNTERED for valid actions
      if (offer.status !== "PENDING" && offer.status !== "COUNTERED") {
        return NextResponse.json(
          { error: "This offer has already been processed" },
          { status: 400 },
        );
      }
    }

    let updateData = {};
    const now = new Date();

    switch (action) {
      case "accept":
        updateData = {
          status: "ACCEPTED",
          finalPrice: offer.initialOffer,
          acceptedAt: now,
        };
        // Note: Product price is NOT changed - the negotiated price only applies to this order
        break;

      case "accept_counter":
        // Buyer accepts the seller's counter offer
        updateData = {
          status: "ACCEPTED",
          finalPrice: offer.counterOffer,
          acceptedAt: now,
        };
        // Note: Product price is NOT changed - the negotiated price only applies to this order
        break;

      case "reject":
        updateData = {
          status: "REJECTED",
          rejectedAt: now,
        };
        break;

      case "counter":
        if (!counterOffer) {
          return NextResponse.json(
            { error: "Counter offer amount is required" },
            { status: 400 },
          );
        }

        const aiSuggestion = await suggestNegotiationPrice(
          offer.product.price,
          counterOffer,
        );

        updateData = {
          status: "COUNTERED",
          counterOffer,
          message,
          aiSuggestedPrice: aiSuggestion.suggestedPrice,
        };
        break;

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const updatedOffer = await prisma.offer.update({
      where: { id: offerId },
      data: updateData,
      include: {
        product: true,
        buyer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(updatedOffer);
  } catch (error) {
    console.error("Update offer error:", error);
    return NextResponse.json(
      { error: "Failed to update offer" },
      { status: 500 },
    );
  }
}
