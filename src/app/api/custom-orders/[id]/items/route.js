import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken, extractToken } from "@/lib/auth";

// PATCH /api/custom-orders/[id]/items - Auto-price lookup for custom order items
export async function PATCH(request, { params }) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = extractToken(authHeader);

    if (!token) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const user = await verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;
    const body = await request.json();
    const { itemName } = body;

    if (!itemName) {
      return NextResponse.json({ error: "Item name required" }, { status: 400 });
    }

    // Verify order exists and user has permission
    const customOrder = await prisma.customOrder.findUnique({
      where: { id },
      select: { sellerId: true, userId: true },
    });

    if (!customOrder) {
      return NextResponse.json({ error: "Custom order not found" }, { status: 404 });
    }

    const isSeller = customOrder.sellerId === user.id;
    const isBuyer = customOrder.userId === user.id;
    const isAdmin = user.role === "ADMIN";

    if (!isSeller && !isBuyer && !isAdmin) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // Search for product by name
    const products = await prisma.product.findMany({
      where: {
        status: "ACTIVE",
        name: { contains: itemName, mode: "insensitive" },
      },
      select: {
        id: true,
        name: true,
        price: true,
        unit: true,
      },
      take: 1,
    });

    const result = {
      price: products.length > 0 ? products[0].price : null,
      productId: products.length > 0 ? products[0].id : null,
      productName: products.length > 0 ? products[0].name : null,
      unit: products.length > 0 ? products[0].unit : null,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Auto-price lookup error:", error);
    return NextResponse.json({ error: "Failed to lookup product price" }, { status: 500 });
  }
}