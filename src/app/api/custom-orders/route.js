import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken, extractToken } from "@/lib/auth";
import { v4 as uuidv4 } from "uuid";

export async function GET(request) {
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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const type = searchParams.get("type"); // 'buyer', 'seller'

    let where = {};
    if (type === "seller") {
      where = { sellerId: user.id };
    } else {
      where = { userId: user.id };
    }

    if (status) {
      // Validate status against CustomOrderStatus enum values
      const validStatuses = [
        'PENDING',
        'VERIFIED',
        'CONFIRMED',
        'PROCESSING',
        'OUT_FOR_DELIVERY',
        'DELIVERED',
        'CANCELLED'
      ];
      if (validStatuses.includes(status)) {
        where.status = status;
      }
      // If invalid status, ignore it (don't filter by status)
    }

    const customOrders = await prisma.customOrder.findMany({
      where,
        include: {
          items: true,
          buyer: {
            select: { id: true, name: true, email: true, phone: true }
          },
          seller: {
            select: { id: true, name: true, email: true }
          }
        },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(customOrders);
  } catch (error) {
    console.error("Get custom orders error:", error);
    return NextResponse.json({ error: "Failed to fetch custom orders" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = extractToken(authHeader);

    if (!token) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const user = await verifyToken(token);
    if (!user || user.role !== "BUYER") {
      return NextResponse.json({ error: "Only buyers can create custom orders" }, { status: 403 });
    }

    const body = await request.json();
    const { items, sellerId, shippingAddress, notes, shippingMethod, buyerLatitude, buyerLongitude, sellerLatitude, sellerLongitude } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Items are required" }, { status: 400 });
    }

    if (!sellerId) {
      return NextResponse.json({ error: "Seller ID is required" }, { status: 400 });
    }

    // Verify seller exists and is SELLER
    const seller = await prisma.user.findFirst({
      where: { id: sellerId, role: "SELLER" }
    });
    if (!seller) {
      return NextResponse.json({ error: "Invalid seller" }, { status: 400 });
    }

    // Calculate subtotal from items
    let subtotal = 0;
    for (const item of items) {
      const itemTotal = (item.price || 0) * (item.quantity || 0);
      subtotal += itemTotal;
    }

    // Generate order number
    const orderNumber = `CUST-ORD-${Date.now()}-${uuidv4().slice(0, 8).toUpperCase()}`;

    // Calculate tax and shipping based on distance
    const tax = subtotal * 0.1; // 10% tax
    // Validate coordinates
    const buyerLat = parseFloat(buyerLatitude);
    const buyerLng = parseFloat(buyerLongitude);
    const sellerLat = parseFloat(sellerLatitude);
    const sellerLng = parseFloat(sellerLongitude);
    
    let distance = 0;
    if (!isNaN(buyerLat) && !isNaN(buyerLng) && !isNaN(sellerLat) && !isNaN(sellerLng)) {
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
          Math.sin(dLon / 2) * Math.sin(dLon / 2) *
          Math.cos(lat1Rad) * Math.cos(lat2Rad);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
      };
      distance = haversineDistance(buyerLat, buyerLng, sellerLat, sellerLng);
    }
    // Shipping cost per km based on shipping method
    const ratePerKm = {
      standard: 0.5,
      express: 1.0,
      overnight: 2.0,
    }[shippingMethod] || 0.5;
    const shippingCost = distance * ratePerKm;
    const total = subtotal + tax + shippingCost;
    
    // Create custom order
    const customOrder = await prisma.customOrder.create({
      data: {
        userId: user.id,
        sellerId,
        orderNumber,
        shippingAddress,
        notes,
        shippingMethod,
        distance,
        subtotal,
        tax,
        shippingCost,
        total,
        items: {
          create: items.map(item => ({
            customItemName: item.name,
            requestedQuantity: parseFloat(item.quantity),
            unit: item.unit || null,
            verifiedPrice: item.price ? parseFloat(item.price) : null
          }))
        }
      },
      include: {
        items: true,
        buyer: true,
        seller: true
      }
    });

    return NextResponse.json(customOrder, { status: 201 });
  } catch (error) {
    console.error("Create custom order error:", error);
    return NextResponse.json({ error: "Failed to create custom order" }, { status: 500 });
  }
}
