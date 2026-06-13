import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken, extractToken } from "@/lib/auth";
import { v4 as uuidv4 } from "uuid";


export async function POST(request, { params }) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = extractToken(authHeader);

    if (!token) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const user = await verifyToken(token);
    if (!user || user.role !== "BUYER") {
      return NextResponse.json({ error: "Only buyers can confirm custom orders" }, { status: 403 });
    }

    const { id } = await params;

    const customOrder = await prisma.customOrder.findUnique({
      where: { id },
      include: { items: true, buyer: true, seller: true }
    });

    if (!customOrder || customOrder.status !== "VERIFIED") {
      return NextResponse.json({ error: "Custom order not ready for confirmation" }, { status: 400 });
    }

    if (customOrder.userId !== user.id) {
      return NextResponse.json({ error: "Not your order" }, { status: 403 });
    }

    // Just update custom order status to CONFIRMED
    await prisma.customOrder.update({
      where: { id },
      data: { status: "CONFIRMED" }
    });

    // Return updated custom order
    const updatedOrder = await prisma.customOrder.findUnique({
      where: { id },
      include: { items: true, buyer: true, seller: true }
    });

    return NextResponse.json(updatedOrder, { status: 200 });
  } catch (error) {
    console.error("Confirm custom order error:", error);
    return NextResponse.json({ error: "Failed to confirm custom order" }, { status: 500 });
  }
}


