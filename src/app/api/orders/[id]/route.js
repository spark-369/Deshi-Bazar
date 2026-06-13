import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken, extractToken } from "@/lib/auth";

// GET /api/orders/[id] - Get single order
export async function GET(request, { params }) {
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

    const { id } = await params;

    const order = await prisma.order.findUnique({
      where: { id },
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
                    email: true,
                    phone: true,
                  },
                },
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
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Verify ownership or admin or seller
    const isBuyer = order.userId === user.id;
    const isAdmin = user.role === "ADMIN";
    const isSellerRole = user.role === "SELLER";
    
    // Check if user is a seller of any product in this order
    const orderItems = await prisma.orderItem.findMany({
      where: { orderId: id },
      include: { product: true },
    });
    const isProductSeller = orderItems.some(item => item.product.sellerId === user.id);
    
    // Seller can view if they have SELLER role OR own any product in the order
    const isSeller = isSellerRole || isProductSeller;

    if (!isBuyer && !isAdmin && !isSeller) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("Get order error:", error);
    return NextResponse.json(
      { error: "Failed to fetch order" },
      { status: 500 },
    );
  }
}

// PUT /api/orders/[id] - Update order details (seller / admin)
export async function PUT(request, { params }) {
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

    const { id } = await params;
    const body = await request.json();
    const {
      status,
      shippingAddress,
      notes,
      shippingMethod,
      predictedDeliveryDate,
    } = body;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: { product: true },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Verify ownership or admin or seller
    const isBuyer = order.userId === user.id;
    const isAdmin = user.role === "ADMIN";
    const isSellerRole = user.role === "SELLER";

    const orderItems = await prisma.orderItem.findMany({
      where: { orderId: id },
      include: { product: true },
    });
    const isProductSeller = orderItems.some(
      (item) => item.product.sellerId === user.id,
    );
    const isSeller = isSellerRole || isProductSeller;

    if (!isBuyer && !isAdmin && !isSeller) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // Build update data – only include fields that were actually provided
    const updateData = {};
    if (status !== undefined) {
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
      if (!validStatuses.includes(status.toUpperCase())) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }
      updateData.status = status.toUpperCase();
    }
    if (shippingAddress !== undefined) updateData.shippingAddress = shippingAddress;
    if (notes !== undefined) updateData.notes = notes;
    if (shippingMethod !== undefined) updateData.shippingMethod = shippingMethod;
    if (predictedDeliveryDate !== undefined) {
      updateData.predictedDeliveryDate = predictedDeliveryDate
        ? new Date(predictedDeliveryDate)
        : null;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 },
      );
    }

    await prisma.order.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ message: "Order updated successfully" });
  } catch (error) {
    console.error("Update order error:", error);
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 },
    );
  }
}

// DELETE /api/orders/[id] - Delete order
export async function DELETE(request, { params }) {
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

    const { id } = await params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Verify ownership or admin or seller
    const isBuyer = order.userId === user.id;
    const isAdmin = user.role === "ADMIN";
    const isSellerRole = user.role === "SELLER";

    // Check if user is a seller of any product in this order
    const orderItems = await prisma.orderItem.findMany({
      where: { orderId: id },
      include: { product: true },
    });
    const isProductSeller = orderItems.some(item => item.product.sellerId === user.id);

    // Seller can delete if they have SELLER role OR own any product in the order
    const isSeller = isSellerRole || isProductSeller;

    if (!isBuyer && !isAdmin && !isSeller) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // Only allow deletion of PENDING or CANCELLED orders
    if (order.status !== "PENDING" && order.status !== "CANCELLED") {
      return NextResponse.json(
        { error: "Can only delete pending or cancelled orders" },
        { status: 400 },
      );
    }

    // Delete order and restore stock
    await prisma.$transaction(async (tx) => {
      // Restore stock for each item
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              increment: item.quantity,
            },
          },
        });
      }

      // Delete order items
      await tx.orderItem.deleteMany({
        where: { orderId: id },
      });

      // Delete payments
      await tx.payment.deleteMany({
        where: { orderId: id },
      });

      // Delete order
      await tx.order.delete({
        where: { id },
      });
    });

    return NextResponse.json({ message: "Order deleted successfully" });
  } catch (error) {
    console.error("Delete order error:", error);
    return NextResponse.json(
      { error: "Failed to delete order" },
      { status: 500 },
    );
  }
}
