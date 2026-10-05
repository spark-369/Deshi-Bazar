import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken, extractToken } from "@/lib/auth";
import { forecastSales, predictChurn, generateRecommendations } from "@/lib/ai";

// GET /api/admin/analytics - Get overall analytics
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
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "30"; // days

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    // Get order statistics
    const [totalOrders, recentOrders, totalRevenue, pendingOrders] =
      await Promise.all([
        prisma.order.count(),
        prisma.order.findMany({
          where: {
            createdAt: { gte: startDate },
          },
          select: {
            id: true,
            total: true,
            status: true,
            createdAt: true,
          },
        }),
        prisma.order.aggregate({
          where: {
            status: { in: ["CONFIRMED", "SHIPPED", "DELIVERED"] },
          },
          _sum: { total: true },
        }),
        prisma.order.count({
          where: { status: "PENDING" },
        }),
      ]);

    // Calculate revenue for period
    const periodRevenue = recentOrders
      .filter((o) => ["CONFIRMED", "SHIPPED", "DELIVERED"].includes(o.status))
      .reduce((sum, o) => sum + o.total, 0);

    // Get product statistics
    const [totalProducts, lowStockProducts, outOfStock] = await Promise.all([
      prisma.product.count({ where: { status: "ACTIVE" } }),
      prisma.product.count({
        where: { status: "ACTIVE", stock: { lte: 5, gt: 0 } },
      }),
      prisma.product.count({ where: { status: "ACTIVE", stock: 0 } }),
    ]);

    // Get user statistics
    const [totalUsers, newUsers] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: {
          createdAt: { gte: startDate },
        },
      }),
    ]);

    // Get review statistics
    const [totalReviews, fakeReviews] = await Promise.all([
      prisma.review.count(),
      prisma.review.count({ where: { isFake: true } }),
    ]);

    // Get payment statistics
    const [totalPayments, flaggedPayments] = await Promise.all([
      prisma.payment.count(),
      prisma.payment.count({ where: { isFlagged: true } }),
    ]);

    // Calculate daily sales for chart
    const dailySales = {};
    recentOrders.forEach((order) => {
      const date = order.createdAt.toISOString().split("T")[0];
      if (!dailySales[date]) {
        dailySales[date] = { orders: 0, revenue: 0 };
      }
      dailySales[date].orders += 1;
      if (["CONFIRMED", "SHIPPED", "DELIVERED"].includes(order.status)) {
        dailySales[date].revenue += order.total;
      }
    });

    // Get top selling products
    const topProducts = await prisma.orderItem.groupBy({
      by: ["productId"],
      _sum: { quantity: true, finalPrice: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 10,
    });

    // Batch fetch product details for top products
    const productIds = topProducts.map(item => item.productId);
    const productDetails = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, price: true },
    });
    const productMap = new Map(productDetails.map(p => [p.id, p]));

    const topProductsWithDetails = topProducts.map(item => ({
      productId: item.productId,
      name: productMap.get(item.productId)?.name,
      sold: item._sum.quantity,
      revenue: item._sum.finalPrice,
    }));

    // Get category distribution
    const categoryDistribution = await prisma.product.groupBy({
      by: ["categoryId"],
      _count: true,
    });

    // Batch fetch category details
    const categoryIds = categoryDistribution.map(cat => cat.categoryId);
    const categoryDetails = await prisma.category.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true, name: true },
    });
    const categoryMap = new Map(categoryDetails.map(c => [c.id, c.name]));

    const categoriesWithCount = categoryDistribution.map(cat => ({
      category: categoryMap.get(cat.categoryId),
      count: cat._count,
    }));

    // Prepare historical data for AI forecasting
    const historicalData = Object.entries(dailySales).map(([date, data]) => ({
      date,
      revenue: data.revenue,
      orders: data.orders,
    }));

    // Get AI sales forecast
    const salesForecast = await forecastSales(historicalData);

    // Get trending products
    const trendingProducts = await prisma.trendingProduct.findMany({
      orderBy: { trendScore: "desc" },
      take: 10,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            images: true,
          },
        },
      },
    });

    return NextResponse.json({
      overview: {
        totalOrders,
        totalRevenue: totalRevenue._sum.total || 0,
        periodRevenue,
        pendingOrders,
        totalProducts,
        lowStockProducts,
        outOfStock,
        totalUsers,
        newUsers,
        totalReviews,
        fakeReviews,
        totalPayments,
        flaggedPayments,
      },
      chartData: dailySales,
      topProducts: topProductsWithDetails,
      categories: categoriesWithCount,
      salesForecast,
      trendingProducts,
    });
  } catch (error) {
    console.error("Get analytics error:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 },
    );
  }
}
