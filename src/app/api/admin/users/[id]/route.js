import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken, extractToken } from "@/lib/auth";

// GET /api/admin/users/[id] - Get single user detail for admin
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const authHeader = request.headers.get("authorization");
    const token = extractToken(authHeader);

    if (!token) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const admin = await verifyToken(token);
    if (!admin || admin.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        isVerified: true,
        twoFactorEnabled: true,
        latitude: true,
        longitude: true,
        createdAt: true,
        updatedAt: true,
        profile: {
          select: {
            bio: true,
            avatar: true,
            address: true,
            city: true,
            division: true,
            district: true,
            country: true,
            totalSpent: true,
            purchaseCount: true,
            avgOrderValue: true,
            lastPurchaseDate: true,
            interests: true,
            preferences: true,
          },
        },
        _count: {
          select: {
            orders: true,
            products: true,
            reviews: true,
            offers: true,
            payments: true,
            wishlist: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Fetch churn prediction (separate table with no FK relation)
    const churnPrediction = await prisma.churnPrediction.findUnique({
      where: { userId: id },
    });

    return NextResponse.json({
      user: { ...user, churnPrediction },
    });
  } catch (error) {
    console.error("Get admin user error:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 },
    );
  }
}
