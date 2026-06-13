import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken, extractToken } from "@/lib/auth";

// GET /api/admin/churn-predictions - Get churn predictions with filtering
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

    // Filter parameters
    const riskLevel = searchParams.get("riskLevel");
    const minScore = parseFloat(searchParams.get("minScore"));
    const maxScore = parseFloat(searchParams.get("maxScore"));
    const userId = searchParams.get("userId");
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 20;
    const sortBy = searchParams.get("sortBy") || "churnScore";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    // Build where clause
    const where = {};

    if (riskLevel) where.riskLevel = riskLevel;
    if (!isNaN(minScore)) where.churnScore = { gte: minScore };
    if (!isNaN(maxScore)) {
      where.churnScore = where.churnScore || {};
      where.churnScore.lte = maxScore;
    }
    if (userId) where.userId = userId;

    // Get total count
    const total = await prisma.churnPrediction.count({ where });

    // Get predictions with pagination
    const predictions = await prisma.churnPrediction.findMany({
      where,
      orderBy: {
        [sortBy]: sortOrder,
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Fetch user data separately since there's no direct relation
    const userIds = [...new Set(predictions.map(p => p.userId))];
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    // Merge user data into predictions
    const predictionsWithUser = predictions.map(prediction => ({
      ...prediction,
      user: users.find(u => u.id === prediction.userId),
    }));

    return NextResponse.json({
      predictions: predictionsWithUser,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get churn predictions error:", error);
    return NextResponse.json(
      { error: "Failed to fetch churn predictions" },
      { status: 500 },
    );
  }
}