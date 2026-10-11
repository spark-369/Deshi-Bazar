import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken, extractToken } from "@/lib/auth";
import { detectFraud } from "@/lib/ai";
import { v4 as uuidv4 } from "uuid";

// GET /api/payments - Get payments (own for buyer/seller, all for admin)
export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = extractToken(authHeader);

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 },
      );
    }

    const user = await verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const skip = (page - 1) * limit;

    let baseQuery = {};

    if (user.role === 'ADMIN') {
      baseQuery = {};
    } else if (user.role === 'SELLER') {
      const sellerProductIds = await prisma.product.findMany({
        where: { sellerId: user.id },
        select: { id: true },
      });
      const productIds = sellerProductIds.map((p) => p.id);
      baseQuery = {
        OR: [
          {
            order: {
              items: {
                some: { productId: { in: productIds } },
              },
            },
          },
          { customOrder: { sellerId: user.id } },
        ],
      };
    } else {
      baseQuery = { userId: user.id };
    }

    const whereConditions = [baseQuery];

    if (status) {
      whereConditions.push({ status });
    }

    if (search) {
      const numeric = isNaN(parseFloat(search)) ? null : parseFloat(search);
      const validStatuses = ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED', 'FLAGGED'];
      const upperSearch = search.toUpperCase();
      const statusMatch = validStatuses.find((s) => s.includes(upperSearch));
      const searchConditions = [
        { order: { orderNumber: { contains: search, mode: 'insensitive' } } },
        { customOrder: { orderNumber: { contains: search, mode: 'insensitive' } } },
        { transactionId: { contains: search, mode: 'insensitive' } },
        { method: { contains: search, mode: 'insensitive' } },
        { currency: { contains: search, mode: 'insensitive' } },
        { flagReason: { contains: search, mode: 'insensitive' } },
        { cardLast4: { contains: search, mode: 'insensitive' } },
        ...(statusMatch ? [{ status: { equals: statusMatch } }] : []),
        ...(numeric !== null
          ? [
              { amount: { equals: numeric } },
              { fraudScore: { equals: numeric } },
            ]
          : []),
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ];
      whereConditions.push({ OR: searchConditions });
    }

    const where = whereConditions.length > 1 ? { AND: whereConditions } : whereConditions[0];

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true } },
          order: true,
          customOrder: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.payment.count({ where }),
    ]);

    return NextResponse.json({
      payments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get payments error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payments' },
      { status: 500 },
    );
  }
}

// POST /api/payments - Process payment
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
      orderId,
      amount,
      method,
      billingAddress,
      shippingAddress,
      transactionId,
      mobileNumber,
    } = body;

    if (!orderId || !amount || !method) {
      return NextResponse.json(
        { error: "Order ID, amount, and method are required" },
        { status: 400 },
      );
    }

    // Validate Bkash payment
    if (method === "bkash") {
      if (!transactionId || !mobileNumber) {
        return NextResponse.json(
          {
            error:
              "Transaction ID and mobile number are required for Bkash payment",
          },
          { status: 400 },
        );
      }
    }

    // Get order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: {
          include: {
            profile: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Only the order owner or an admin can pay
    if (order.userId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    if (order.total !== amount) {
      return NextResponse.json(
        { error: "Amount does not match order total" },
        { status: 400 },
      );
    }

    // Get user history for fraud detection
    const userHistory = {
      avgOrderValue: order.user.profile?.avgOrderValue || 0,
      accountAge: Math.floor(
        (Date.now() - new Date(order.user.createdAt).getTime()) /
          (1000 * 60 * 60 * 24),
      ),
      recentTransactions: await prisma.payment.count({
        where: {
          userId: user.id,
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      }),
    };

    // Run fraud detection
    const fraudResult = await detectFraud(
      {
        amount,
        billingAddress,
        shippingAddress,
        method,
      },
      userHistory,
    );

    // Generate transaction ID if not provided
    const paymentTransactionId =
      transactionId ||
      `TXN-${Date.now()}-${uuidv4().substring(0, 8).toUpperCase()}`;

    const payment = await prisma.payment.create({
      data: {
        userId: user.id,
        orderId,
        amount,
        currency: "BDT",
        method,
        transactionId: paymentTransactionId,
        fraudScore: fraudResult.riskScore,
        isFlagged: fraudResult.isFlagged,
        flagReason: fraudResult.flags.join(", "),
        status: fraudResult.isFlagged ? "FLAGGED" : "PENDING",
      },
    });

    if (fraudResult.isFlagged) {
      return NextResponse.json(
        {
          ...payment,
          fraudDetection: fraudResult,
          message: "Payment flagged for review. Please contact support.",
        },
        { status: 202 },
      );
    }

    // Payment stays PENDING until confirmed/completed by the seller or admin
    return NextResponse.json(
      {
        ...payment,
        fraudDetection: fraudResult,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Payment error:", error);
    return NextResponse.json(
      { error: "Failed to process payment" },
      { status: 500 },
    );
  }
}

// PUT /api/payments - Update payment (seller: their orders, admin: all)
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
    const { paymentId, action, ...updateData } = body;

    if (!paymentId) {
      return NextResponse.json(
        { error: "Payment ID is required" },
        { status: 400 },
      );
    }

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        order: {
          include: {
            items: { include: { product: true } },
          },
        },
      },
    });

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    // Authorization: admin → all; seller → payments for their products
    let isAuthorized = user.role === "ADMIN";
    if (!isAuthorized && user.role === "SELLER") {
      const sellerProductIds = await prisma.product.findMany({
        where: { sellerId: user.id },
        select: { id: true },
      });
      const productIds = sellerProductIds.map((p) => p.id);
      isAuthorized = payment.order?.items?.some((item) =>
        productIds.includes(item.productId),
      );
    }

    if (!isAuthorized) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // Build update payload
    const updatePayload = { ...updateData };

    if (action === "refund") {
      if (payment.status !== "COMPLETED") {
        return NextResponse.json(
          { error: "Can only refund completed payments" },
          { status: 400 },
        );
      }
      updatePayload.status = "REFUNDED";
      if (payment.orderId) {
        await prisma.order.update({
          where: { id: payment.orderId },
          data: { status: "CANCELLED" },
        });
      }
    } else if (action === "approve") {
      updatePayload.status = "COMPLETED";
      updatePayload.isFlagged = false;
      updatePayload.flagReason = null;
      if (payment.orderId) {
        await prisma.order.update({
          where: { id: payment.orderId },
          data: { status: "CONFIRMED" },
        });
      }
    } else if (updateData.status) {
      // Generic status update (seller/admin only)
      const validStatuses = [
        "PENDING",
        "COMPLETED",
        "FAILED",
        "REFUNDED",
        "FLAGGED",
      ];
      if (!validStatuses.includes(updateData.status)) {
        return NextResponse.json(
          { error: "Invalid status" },
          { status: 400 },
        );
      }
      updatePayload.status = updateData.status;
      if (updateData.status === "COMPLETED" && payment.orderId) {
        await prisma.order.update({
          where: { id: payment.orderId },
          data: { status: "CONFIRMED" },
        });
      }
    }

    const updatedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: updatePayload,
      include: {
        order: true,
        user: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json(updatedPayment);
  } catch (error) {
    console.error("Update payment error:", error);
    return NextResponse.json(
      { error: "Failed to update payment" },
      { status: 500 },
    );
  }
}

// DELETE /api/payments - Delete payment (seller: their orders, admin: all)
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
    const paymentId = searchParams.get("paymentId");

    if (!paymentId) {
      return NextResponse.json(
        { error: "Payment ID is required" },
        { status: 400 },
      );
    }

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        order: {
          include: {
            items: { include: { product: true } },
          },
        },
      },
    });

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    // Authorization: admin → all; seller → payments for their products
    let isAuthorized = user.role === "ADMIN";
    if (!isAuthorized && user.role === "SELLER") {
      const sellerProductIds = await prisma.product.findMany({
        where: { sellerId: user.id },
        select: { id: true },
      });
      const productIds = sellerProductIds.map((p) => p.id);
      isAuthorized = payment.order?.items?.some((item) =>
        productIds.includes(item.productId),
      );
    }

    if (!isAuthorized) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    await prisma.payment.delete({ where: { id: paymentId } });

    return NextResponse.json({ message: "Payment deleted successfully" });
  } catch (error) {
    console.error("Delete payment error:", error);
    return NextResponse.json(
      { error: "Failed to delete payment" },
      { status: 500 },
    );
  }
}
