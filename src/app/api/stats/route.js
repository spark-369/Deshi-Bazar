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

    // Calculate average rating from reviews
    const reviews = await prisma.review.findMany({
      select: { rating: true },
    });
    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;
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
