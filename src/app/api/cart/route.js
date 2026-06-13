import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken, extractToken } from "@/lib/auth";

// GET /api/cart - Get user's cart or wishlist
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
    const type = searchParams.get("type"); // 'cart' or 'wishlist'

    // Handle wishlist request
    if (type === "wishlist") {
      const wishlist = await prisma.wishlist.findMany({
        where: { userId: user.id },
        include: {
          product: {
            include: {
              category: true,
              seller: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return NextResponse.json(wishlist);
    }

    // Find or create cart
    let cart = await prisma.cart.findUnique({
      where: { userId: user.id },
      include: {
        items: {
          include: {
            product: {
              include: {
                category: true,
                seller: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId: user.id },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });
    }

    // Calculate totals
    let totalPrice = 0;
    let discount = 0;

    const itemsWithTotals = cart.items.map((item) => {
      const itemTotal = item.finalPrice * item.quantity;
      totalPrice += itemTotal;

      if (item.offerPrice && item.offerPrice < item.originalPrice) {
        discount += (item.originalPrice - item.offerPrice) * item.quantity;
      }

      return {
        ...item,
        itemTotal,
      };
    });

    // Get suggested "frequently bought together" items
    const productIds = cart.items.map((item) => item.productId);
    const suggestedItems = await prisma.product.findMany({
      where: {
        id: { notIn: productIds },
        status: "ACTIVE",
        categoryId: {
          in: cart.items.map((item) => item.product.categoryId),
        },
      },
      take: 5,
      include: {
        category: true,
      },
    });

    return NextResponse.json({
      ...cart,
      items: itemsWithTotals,
      totalPrice,
      discount,
      finalPrice: totalPrice,
      suggestedItems,
    });
  } catch (error) {
    console.error("Get cart error:", error);
    return NextResponse.json(
      { error: "Failed to fetch cart" },
      { status: 500 },
    );
  }
}

// POST /api/cart - Add item to cart
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
    const { productId, quantity = 1, type = "cart" } = body;

    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 },
      );
    }

    // Handle wishlist
    if (type === "wishlist") {
      // Check if already in wishlist
      const existingWishlistItem = await prisma.wishlist.findFirst({
        where: {
          userId: user.id,
          productId,
        },
      });

      if (existingWishlistItem) {
        return NextResponse.json({ message: "Item already in wishlist" });
      }

      await prisma.wishlist.create({
        data: {
          userId: user.id,
          productId,
        },
      });

      return NextResponse.json(
        { message: "Added to wishlist" },
        { status: 201 },
      );
    }

    // Get product
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    if (product.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Product is not available" },
        { status: 400 },
      );
    }

    // Check for accepted offer
    const acceptedOffer = await prisma.offer.findFirst({
      where: {
        productId,
        buyerId: user.id,
        status: "ACCEPTED",
      },
    });

    const offerPrice = acceptedOffer ? acceptedOffer.finalPrice : null;

    // Find or create cart
    let cart = await prisma.cart.findUnique({
      where: { userId: user.id },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId: user.id },
      });
    }

    // Check if item already in cart
    const existingItem = await prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId,
      },
    });

    if (existingItem) {
      // Update quantity
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: existingItem.quantity + quantity,
          offerPrice,
          finalPrice: offerPrice || existingItem.originalPrice,
        },
      });
    } else {
      // Add new item
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          quantity,
          originalPrice: product.price,
          offerPrice,
          finalPrice: offerPrice || product.price,
        },
      });
    }

    // Update user browsing history
    await prisma.userProfile.update({
      where: { userId: user.id },
      data: {
        browsingHistory: {
          push: productId,
        },
      },
    });

    return NextResponse.json(
      { message: "Item added to cart" },
      { status: 201 },
    );
  } catch (error) {
    console.error("Add to cart error:", error);
    return NextResponse.json(
      { error: "Failed to add item to cart" },
      { status: 500 },
    );
  }
}

// PUT /api/cart - Update cart item quantity
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
    const { itemId, quantity } = body;

    if (!itemId || quantity === undefined) {
      return NextResponse.json(
        { error: "Item ID and quantity are required" },
        { status: 400 },
      );
    }

    // Get cart item
    const cartItem = await prisma.cartItem.findUnique({
      where: { id: itemId },
      include: { cart: true },
    });

    if (!cartItem) {
      return NextResponse.json(
        { error: "Cart item not found" },
        { status: 404 },
      );
    }

    // Verify ownership
    if (cartItem.cart.userId !== user.id) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    if (quantity <= 0) {
      // Remove item
      await prisma.cartItem.delete({
        where: { id: itemId },
      });
    } else {
      // Update quantity
      await prisma.cartItem.update({
        where: { id: itemId },
        data: {
          quantity,
          finalPrice:
            (cartItem.offerPrice || cartItem.originalPrice) * quantity,
        },
      });
    }

    return NextResponse.json({ message: "Cart updated" });
  } catch (error) {
    console.error("Update cart error:", error);
    return NextResponse.json(
      { error: "Failed to update cart" },
      { status: 500 },
    );
  }
}

// DELETE /api/cart - Remove item from cart
export async function DELETE(request) {
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
    const itemId = searchParams.get("itemId");
    const productId = searchParams.get("productId");
    const clearAll = searchParams.get("clearAll") === "true";
    const type = searchParams.get("type");

    // Handle wishlist removal
    if (type === "wishlist" && productId) {
      await prisma.wishlist.deleteMany({
        where: {
          userId: user.id,
          productId,
        },
      });
      return NextResponse.json({ message: "Removed from wishlist" });
    }

    if (clearAll) {
      // Clear entire cart
      const cart = await prisma.cart.findUnique({
        where: { userId: user.id },
      });

      if (cart) {
        await prisma.cartItem.deleteMany({
          where: { cartId: cart.id },
        });
      }
    } else if (itemId) {
      // Remove specific item
      const cartItem = await prisma.cartItem.findUnique({
        where: { id: itemId },
        include: { cart: true },
      });

      if (!cartItem) {
        return NextResponse.json(
          { error: "Cart item not found" },
          { status: 404 },
        );
      }

      if (cartItem.cart.userId !== user.id) {
        return NextResponse.json({ error: "Not authorized" }, { status: 403 });
      }

      await prisma.cartItem.delete({
        where: { id: itemId },
      });
    } else {
      return NextResponse.json(
        { error: "Item ID or clearAll flag is required" },
        { status: 400 },
      );
    }

    return NextResponse.json({ message: "Cart updated" });
  } catch (error) {
    console.error("Delete from cart error:", error);
    return NextResponse.json(
      { error: "Failed to update cart" },
      { status: 500 },
    );
  }
}
