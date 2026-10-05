import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken, extractToken } from "@/lib/auth";
import { predictDeliveryTime } from "@/lib/ai";
import { v4 as uuidv4 } from "uuid";

// GET /api/orders - Get user's orders
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
    const status = searchParams.get("status");
    const type = searchParams.get("type"); // 'buyer', 'seller', or 'all'
    const division = searchParams.get("division");
    const district = searchParams.get("district");
    const search = searchParams.get("search");

    let where = {};

    if (type === "seller") {
      // Get orders for seller's products
      const sellerProducts = await prisma.product.findMany({
        where: { sellerId: user.id },
        select: { id: true },
      });
      const productIds = sellerProducts.map((p) => p.id);

      if (productIds.length > 0) {
        where = {
          items: {
            some: {
              productId: { in: productIds },
            },
          },
        };
      } else {
        where = { id: "none" }; // Return empty if no products
      }
    } else if (type === "buyer" || !type) {
      // Default: get buyer's orders
      where = { userId: user.id };
    } else if (type === "all") {
      // Get all orders related to user (both buyer and seller)
      const sellerProducts = await prisma.product.findMany({
        where: { sellerId: user.id },
        select: { id: true },
      });
      const productIds = sellerProducts.map((p) => p.id);

      where = {
        OR: [
          { userId: user.id },
          ...(productIds.length > 0
            ? [{ items: { some: { productId: { in: productIds } } } }]
            : []),
        ],
      };
    }

    if (status) {
      where.status = status;
    }

    // Filter by division / district (parsed from the shippingAddress string)
    const addressFilters = [];
    if (division) {
      addressFilters.push({ shippingAddress: { contains: division, mode: "insensitive" } });
    }
    if (district) {
      addressFilters.push({ shippingAddress: { contains: district, mode: "insensitive" } });
    }

    // Generic search across order number, buyer name/email, and address
    if (search) {
      const searchFilter = {
        OR: [
          { orderNumber: { contains: search, mode: "insensitive" } },
          { shippingAddress: { contains: search, mode: "insensitive" } },
          {
            user: {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
              ],
            },
          },
        ],
      };
      addressFilters.push(searchFilter);
    }

    if (addressFilters.length > 0) {
      where.AND = addressFilters;
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        items: {
          include: {
            product: {
              include: {
                category: true,
              },
            },
          },
        },
        payments: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error("Get orders error:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 },
    );
  }
}

// POST /api/orders - Create order from cart
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
    const {
      shippingAddress,
      shipCountry,
      shipDivision,
      shipDistrict,
      shipPostalCode,
      notes,
      shippingMethod = "standard",
      buyerLatitude,
      buyerLongitude,
      sellerLatitude,
      sellerLongitude,
    } = body;

    // Get user's cart
    const cart = await prisma.cart.findUnique({
      where: { userId: user.id },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    // Get billing address from seller's profile (first product's seller)
    let billingAddress = "No seller address";
    let billingCountry = "";
    let billingDivision = "";
    let billingDistrict = "";
    let billingPostalCode = "";
    if (cart.items.length > 0 && cart.items[0]?.product?.sellerId) {
      const sellerProfile = await prisma.userProfile.findUnique({
        where: { userId: cart.items[0].product.sellerId },
      });

      if (sellerProfile) {
        billingAddress = sellerProfile.address || "No seller address";

        billingCountry = sellerProfile.country || "";
        billingDivision = sellerProfile.division || sellerProfile.state || "";
        billingDistrict = sellerProfile.district || sellerProfile.city || "";
        billingPostalCode = sellerProfile.postalCode || sellerProfile.zipCode || "";
      }
    }

    // Validate stock and calculate totals
    let subtotal = 0;
    let discount = 0;
    const orderItems = [];

    for (const item of cart.items) {
      if (item.product.stock < item.quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for ${item.product.name}` },
          { status: 400 },
        );
      }

      const itemTotal = item.finalPrice * item.quantity;
      subtotal += itemTotal;

      if (item.offerPrice) {
        discount += (item.originalPrice - item.offerPrice) * item.quantity;
      }

      orderItems.push({
        productId: item.productId,
        quantity: item.quantity,
        price: item.originalPrice,
        offerDiscount: item.offerPrice
          ? item.originalPrice - item.offerPrice
          : 0,
        finalPrice: item.finalPrice,
      });
    }

    // Calculate tax and shipping based on distance
    const tax = subtotal * 0.1; // 10% tax
    // Validate coordinates
    const buyerLat = parseFloat(buyerLatitude);
    const buyerLng = parseFloat(buyerLongitude);
    const sellerLat = parseFloat(sellerLatitude);
    const sellerLng = parseFloat(sellerLongitude);

    let distance = 0;
    // Only calculate distance if we have valid coordinates (not empty, not NaN)
    if (
      buyerLatitude !== "" &&
      buyerLongitude !== "" &&
      sellerLatitude !== "" &&
      sellerLongitude !== "" &&
      !isNaN(buyerLat) &&
      !isNaN(buyerLng) &&
      !isNaN(sellerLat) &&
      !isNaN(sellerLng)
    ) {
      // Haversine formula to calculate distance between two points in kilometers
      const toRad = (value) => (value * Math.PI) / 180;
      const haversineDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371; // Earth's radius in km
        const dLat = toRad(lat2 - lat1);
        const dLon = toRad(lon2 - lon1);
        const lat1Rad = toRad(lat1);
        const lat2Rad = toRad(lat2);
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.sin(dLon / 2) *
            Math.sin(dLon / 2) *
            Math.cos(lat1Rad) *
            Math.cos(lat2Rad);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
      };
      distance = haversineDistance(buyerLat, buyerLng, sellerLat, sellerLng);
    }
    // Shipping cost per km based on shipping method
    const ratePerKm =
      {
        standard: 0.5,
        express: 1.0,
        overnight: 2.0,
      }[shippingMethod] || 0.5;
    const shippingCost = distance * ratePerKm;
    const total = subtotal + tax + shippingCost - discount;

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${uuidv4().substring(0, 8).toUpperCase()}`;

    // Predict delivery time
    const deliveryPrediction = await predictDeliveryTime(
      shippingMethod,
      shippingAddress,
    );

    // Create order in transaction
    const order = await prisma.$transaction(async (tx) => {
      // Create order
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          subtotal,
          discount,
          tax,
          shippingCost,
          total,
          shippingAddress,
          billingAddress,
          shipCountry,
          shipDivision,
          shipDistrict,
          shipPostalCode,
          billingCountry: billingCountry,
          billingDivision: billingDivision,
          billingDistrict: billingDistrict,
          billingPostalCode: billingPostalCode,
          notes,
          shippingMethod,
          distance,
          // AI delivery predictions (keeping for now, but note that delivery table is removed)
          predictedDeliveryDate: new Date(deliveryPrediction.predictedDate),
          deliveryRiskScore: deliveryPrediction.riskScore,
          items: {
            create: orderItems,
          },
          user: {
            connect: { id: user.id },
          },
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      // Update product stock
      for (const item of cart.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });
      }

      // Clear cart
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      // Update user profile purchase history (flat, deduplicated list)
      const newProductIds = cart.items.map((item) => item.productId);
      const currentProfile = await tx.userProfile.findUnique({
        where: { userId: user.id },
        select: { purchaseHistory: true },
      });
      const currentHistory = Array.isArray(currentProfile?.purchaseHistory)
        ? currentProfile.purchaseHistory.flat()
        : [];
      const updatedHistory = [...new Set([...currentHistory, ...newProductIds])];
      await tx.userProfile.update({
        where: { userId: user.id },
        data: {
          purchaseHistory: updatedHistory,
          totalSpent: {
            increment: total,
          },
          purchaseCount: {
            increment: 1,
          },
          lastPurchaseDate: new Date(),
        },
      });

      return newOrder;
    });

    return NextResponse.json(
      {
        ...order,
        deliveryPrediction,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Create order error:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 },
    );
  }
}

// PUT /api/orders - Update order status (e.g., cancel)
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
    const { orderId, action, status } = body;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Verify ownership or admin or seller
    const isBuyer = order.userId === user.id;
    const isAdmin = user.role === "ADMIN";
    const isSeller = user.role === "SELLER";

    // Check if user is a seller of any product in this order
    const orderItems = await prisma.orderItem.findMany({
      where: { orderId },
      include: { product: true },
    });

    const isProductSeller = orderItems.some(
      (item) => item.product.sellerId === user.id,
    );
    const isSellerRole = isSeller || isProductSeller;

    // Handle status updates from admin (either via status field or action field)
    if (isAdmin) {
      // Determine which field contains the status
      const statusToUpdate = status || action;

      if (statusToUpdate) {
        // Validate status
        const validStatuses = [
          "PENDING",
          "CONFIRMED",
          "PROCESSING",
          "OUT_FOR_DELIVERY",
          "DELIVERED",
          "CANCELLED",
          "SHIPPED",
          "RETURNED",
        ];
        if (!validStatuses.includes(statusToUpdate)) {
          return NextResponse.json(
            { error: "Invalid status" },
            { status: 400 },
          );
        }

        await prisma.order.update({
          where: { id: orderId },
          data: { status: statusToUpdate },
        });

        return NextResponse.json({
          message: "Order status updated successfully",
        });
      }
    }

    // Otherwise, use action-based logic (for backward compatibility)
    if (!isBuyer && !isAdmin && !isSellerRole) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    switch (action) {
      case "cancel":
        // Only buyer or admin can cancel
        if (!isBuyer && !isAdmin) {
          return NextResponse.json(
            { error: "Only buyer or admin can cancel the order" },
            { status: 403 },
          );
        }
        if (order.status !== "PENDING" && order.status !== "CONFIRMED") {
          return NextResponse.json(
            { error: "Cannot cancel order in current status" },
            { status: 400 },
          );
        }

        await prisma.$transaction(async (tx) => {
          // Restore stock
          const items = await tx.orderItem.findMany({
            where: { orderId },
          });

          for (const item of items) {
            await tx.product.update({
              where: { id: item.productId },
              data: {
                stock: {
                  increment: item.quantity,
                },
              },
            });
          }

          // Update order status
          await tx.order.update({
            where: { id: orderId },
            data: { status: "CANCELLED" },
          });

          // Refund payment if exists
          await tx.payment.updateMany({
            where: { orderId },
            data: { status: "REFUNDED" },
          });
        });
        break;

      case "confirm":
        // Only seller can confirm
        if (!isSellerRole && !isAdmin) {
          return NextResponse.json(
            { error: "Only seller or admin can confirm the order" },
            { status: 403 },
          );
        }
        if (order.status !== "PENDING") {
          return NextResponse.json(
            { error: "Can only confirm pending orders" },
            { status: 400 },
          );
        }

        await prisma.order.update({
          where: { id: orderId },
          data: { status: "CONFIRMED" },
        });
        break;

      case "ship":
        // Only seller can mark as shipped
        if (!isSellerRole && !isAdmin) {
          return NextResponse.json(
            { error: "Only seller or admin can ship the order" },
            { status: 403 },
          );
        }
        if (order.status !== "CONFIRMED") {
          return NextResponse.json(
            { error: "Can only ship confirmed orders" },
            { status: 400 },
          );
        }

        await prisma.$transaction(async (tx) => {
          await tx.order.update({
            where: { id: orderId },
            data: { status: "SHIPPED" },
          });

          // Delivery table removed - no delivery tracking needed
        });
        break;

      case "deliver":
        // Only seller or admin can mark as delivered
        if (!isBuyer && !isAdmin) {
          return NextResponse.json(
            { error: "Only buyer or admin can mark as delivered" },
            { status: 403 },
          );
        }
        if (order.status !== "SHIPPED") {
          return NextResponse.json(
            { error: "Can only mark shipped orders as delivered" },
            { status: 400 },
          );
        }

        await prisma.$transaction(async (tx) => {
          await tx.order.update({
            where: { id: orderId },
            data: { status: "DELIVERED" },
          });

          // Delivery table removed - no delivery tracking needed
        });
        break;

      case "return":
        if (order.status !== "DELIVERED") {
          return NextResponse.json(
            { error: "Can only return delivered orders" },
            { status: 400 },
          );
        }

        await prisma.$transaction(async (tx) => {
          // Update order status
          await tx.order.update({
            where: { id: orderId },
            data: { status: "RETURNED" },
          });

          // Update delivery
          // Delivery table removed - no delivery tracking needed
        });
        break;

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({ message: "Order updated successfully" });
  } catch (error) {
    console.error("Update order error:", error);
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 },
    );
  }
}
