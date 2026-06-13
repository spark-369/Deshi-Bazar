import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken, extractToken } from "@/lib/auth";
import { generateRecommendations } from "@/lib/ai";

// GET /api/recommendations - Get recommendations with filtering
export async function GET(request) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = extractToken(authHeader);

    // Optional auth - allow public access for personalized recommendations
    let user = null;
    if (token) {
      user = await verifyToken(token);
    }

    const { searchParams } = new URL(request.url);

    // Filter parameters
    const userId = searchParams.get("userId") || (user ? user.id : null);
    const productId = searchParams.get("productId");
    const recommendedProductId = searchParams.get("recommendedProductId");
    const minScore = parseFloat(searchParams.get("minScore"));
    const maxScore = parseFloat(searchParams.get("maxScore"));
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 20;
    const sortBy = searchParams.get("sortBy") || "score";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    // Build where clause
    const where = {};

    if (userId) where.userId = userId;
    if (productId) where.productId = productId;
    if (recommendedProductId) where.recommendedProductId = recommendedProductId;
    if (!isNaN(minScore)) where.score = { gte: minScore };
    if (!isNaN(maxScore)) {
      where.score = where.score || {};
      where.score.lte = maxScore;
    }

    // Search in related product names or reasons
    if (search) {
      where.OR = [
        { reason: { contains: search } },
        { product: { name: { contains: search } } },
        { recommendedTo: { name: { contains: search } } },
      ];
    }

    // Get total count
    const total = await prisma.productRecommendation.count({ where });

    // Get recommendations with pagination
    const recommendations = await prisma.productRecommendation.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            images: true,
            price: true,
            status: true,
          },
        },
        recommendedTo: {
          select: {
            id: true,
            name: true,
            images: true,
            price: true,
            status: true,
          },
        },
      },
      orderBy: {
        [sortBy]: sortOrder,
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    return NextResponse.json({
      recommendations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get recommendations error:", error);
    return NextResponse.json(
      { error: "Failed to fetch recommendations" },
      { status: 500 },
    );
  }
}

// POST /api/recommendations - Create recommendations (AI/Admin only)
export async function POST(request) {
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

    const body = await request.json();
    const { generateAI, userId, productId, recommendedProductId, score, reason } = body;

    if (generateAI) {
      // AI-generated recommendations for a user
      if (!userId) {
        return NextResponse.json(
          { error: "userId is required for AI generation" },
          { status: 400 },
        );
      }

      // Get user's viewed products from profile
      const userProfile = await prisma.userProfile.findUnique({
        where: { userId },
        select: { browsingHistory: true },
      });

      const viewedProductIds = userProfile?.browsingHistory || [];
      const viewedProducts = await prisma.product.findMany({
        where: { id: { in: viewedProductIds } },
        select: { id: true, name: true, description: true },
      });

      // Get all active products for recommendations
      const allProducts = await prisma.product.findMany({
        where: { status: "ACTIVE" },
        select: { id: true, name: true, description: true },
      });

      // Generate AI recommendations
      const aiRecommendations = await generateRecommendations(userId, viewedProducts, allProducts);

      // Create recommendations in database
      const baseProductId = viewedProducts.length > 0 ? viewedProducts[0].id : null;
      const createdRecommendations = [];
      for (const rec of aiRecommendations) {
        try {
          const recommendation = await prisma.productRecommendation.create({
            data: {
              userId,
              productId: baseProductId || rec.productId, // Use base product or the recommended one
              recommendedProductId: rec.productId,
              score: rec.score,
              reason: rec.reason,
            },
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  images: true,
                  price: true,
                },
              },
              recommendedTo: {
                select: {
                  id: true,
                  name: true,
                  images: true,
                  price: true,
                },
              },
            },
          });
          createdRecommendations.push(recommendation);
        } catch (error) {
          // Skip duplicates or errors
          console.log("Skipping recommendation creation:", error.message);
        }
      }

      return NextResponse.json({
        message: "AI recommendations generated",
        recommendations: createdRecommendations,
        count: createdRecommendations.length,
      }, { status: 201 });
    } else {
      // Manual recommendation creation
      if (!userId || !productId || !recommendedProductId || score === undefined) {
        return NextResponse.json(
          { error: "userId, productId, recommendedProductId, and score are required" },
          { status: 400 },
        );
      }

      // Create single recommendation
      const recommendation = await prisma.productRecommendation.create({
        data: {
          userId,
          productId,
          recommendedProductId,
          score: parseFloat(score),
          reason,
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              images: true,
              price: true,
            },
          },
          recommendedTo: {
            select: {
              id: true,
              name: true,
              images: true,
              price: true,
            },
          },
        },
      });

      return NextResponse.json(recommendation, { status: 201 });
    }
  } catch (error) {
    console.error("Create recommendation error:", error);
    return NextResponse.json(
      { error: "Failed to create recommendation" },
      { status: 500 },
    );
  }
}

// PUT /api/recommendations - Update recommendation (Admin only)
export async function PUT(request) {
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

    const body = await request.json();
    const { id, score, reason } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Recommendation ID is required" },
        { status: 400 },
      );
    }

    // Update recommendation
    const recommendation = await prisma.productRecommendation.update({
      where: { id },
      data: {
        ...(score !== undefined && { score: parseFloat(score) }),
        ...(reason !== undefined && { reason }),
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            images: true,
            price: true,
          },
        },
        recommendedTo: {
          select: {
            id: true,
            name: true,
            images: true,
            price: true,
          },
        },
      },
    });

    return NextResponse.json(recommendation);
  } catch (error) {
    console.error("Update recommendation error:", error);
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Recommendation not found" },
        { status: 404 },
      );
    }
    return NextResponse.json(
      { error: "Failed to update recommendation" },
      { status: 500 },
    );
  }
}

// DELETE /api/recommendations - Delete recommendation (Admin only)
export async function DELETE(request) {
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
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Recommendation ID is required" },
        { status: 400 },
      );
    }

    // Delete recommendation
    await prisma.productRecommendation.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Recommendation deleted successfully" });
  } catch (error) {
    console.error("Delete recommendation error:", error);
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Recommendation not found" },
        { status: 404 },
      );
    }
    return NextResponse.json(
      { error: "Failed to delete recommendation" },
      { status: 500 },
    );
  }
}