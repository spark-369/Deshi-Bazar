import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/stats - Get public platform statistics.
// All four queries are independent, so they run in parallel — this endpoint is
// on the homepage hot path and parallelizing it roughly quarters its latency.
export async function GET(request) {
  try {
    const [totalSellers, totalProducts, reviewStats, totalOrders] =
      await Promise.all([
        prisma.user.count({ where: { role: "SELLER" } }),
        prisma.product.count({ where: { status: "ACTIVE" } }),
        prisma.review.aggregate({ _avg: { rating: true } }),
        prisma.order.count(),
      ]);

    const avgRating = reviewStats._avg.rating || 0;
    const satisfactionRate = Math.round((avgRating / 5) * 100);

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
