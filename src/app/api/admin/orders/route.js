import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken, extractToken } from "@/lib/auth";

export async function GET(request) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = extractToken(authHeader);
    const user = await verifyToken(token);

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const type = searchParams.get("type"); // 'regular' or 'custom'

    let where = {};
    if (status) where.status = status;
    
    const orders = await prisma.order.findMany({
      where,
      include: {
        user: { select: { name: true, email: true } },
        items: {
          include: { product: true }
        },
        payments: true
      },
      orderBy: { createdAt: "desc" }
    });

    const customOrders = await prisma.customOrder.findMany({
      where,
      include: {
        buyer: { select: { name: true, email: true } },
        seller: { select: { name: true, email: true } },
        items: true,
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ 
      regular: orders, 
      custom: customOrders 
    });
  } catch (error) {
    console.error("Admin orders error:", error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}

