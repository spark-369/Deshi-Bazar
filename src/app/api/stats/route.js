import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/stats - Get public platform statistics
export async function GET(request) {
  try {
    // Count active sellers
    const totalSellers = await prisma.user.count({
      where: { role: "SELLER" },
    });

    // Count active products
    const totalProducts = await prisma.product.count({
      where: { status: "ACTIVE" },
    });

    // Calculate average rating using aggregation instead of fetching all reviews
    const reviewStats = await prisma.review.aggregate({ _avg: { rating: true } });
    const avgRating = reviewStats._avg.rating || 0;
    const satisfactionRate = Math.round((avgRating / 5) * 100);

    // Get total orders (for additional context)
    const totalOrders = await prisma.order.count();

    return NextResponse.json({
      totalSellers,
      totalProducts,
      satisfactionRate,
      totalOrders,
      // Keep support as static (not from DB)
      supportAvailable: true,
    });
  } catch (error) {
    console.error("Get stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 },
    );
  }
}
