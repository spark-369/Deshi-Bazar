import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken, extractToken } from "@/lib/auth";
import { generateRecommendations } from "@/lib/ai";

// GET /api/users/profile/recommendations - Get personalized recommendations
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

    // Get user profile with browsing history
    const profile = await prisma.userProfile.findUnique({
      where: { userId: user.id },
    });

    const browsingHistory = Array.isArray(profile?.browsingHistory)
      ? profile.browsingHistory
      : [];

    // Get viewed products
    let viewedProducts = [];
    if (browsingHistory.length > 0) {
      viewedProducts = await prisma.product.findMany({
        where: {
          id: { in: browsingHistory },
          status: "ACTIVE",
        },
        select: {
          id: true,
          name: true,
          description: true,
        },
      });
    }

    // Get all products for recommendations
    const allProducts = await prisma.product.findMany({
      where: {
        status: "ACTIVE",
        sellerId: { not: user.id }, // Exclude own products
      },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        images: true,
      },
    });

    // Generate AI recommendations
    const recommendations = await generateRecommendations(
      user.id,
      viewedProducts,
      allProducts,
    );

    // Get full product details for recommendations using batch query
    const productIds = recommendations.slice(0, 10).map(rec => rec.productId);
    const recommendedProducts = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: {
        category: true,
        seller: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({
      recommendations: recommendedProducts,
    });
  } catch (error) {
    console.error("Get recommendations error:", error);
    return NextResponse.json(
      { error: "Failed to get recommendations" },
      { status: 500 },
    );
  }
}