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
    const email = searchParams.get("email");
    const productId = searchParams.get("productId");
    const recommendedProductId = searchParams.get("recommendedProductId");
    const minScore = parseFloat(searchParams.get("minScore"));
    const maxScore = parseFloat(searchParams.get("maxScore"));
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 20;
    const sortBy = searchParams.get("sortBy") || "score";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    // Resolve email to userId if provided
    let resolvedUserId = userId;
    if (email) {
      const matchedUser = await prisma.user.findFirst({
        where: { email: { contains: email, mode: "insensitive" } },
        select: { id: true },
      });
      resolvedUserId = matchedUser?.id || "__no_match__";
    }

    // Build where clause
    const where = {};

    if (resolvedUserId) where.userId = resolvedUserId;
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
        user: {
          select: {
            id: true,
            email: true,
            name: true,
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

// POST /api/recommendations - Create recommendations (Admin only)
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
    const { generateAI, userId, email, productId, recommendedProductId, score, reason } = body;

    if (generateAI) {
      // Generate recommendations for a user
      let targetUserId = userId;
      if (!targetUserId && email) {
        const matchedUser = await prisma.user.findFirst({
          where: { email: { contains: email, mode: "insensitive" } },
          select: { id: true },
        });
        targetUserId = matchedUser?.id || null;
      }
      if (!targetUserId) {
        return NextResponse.json(
          { error: "userId or email is required to generate recommendations" },
          { status: 400 },
        );
      }

      // Build the user's interest profile from browsing history, purchase history AND search history
      const userProfile = await prisma.userProfile.findUnique({
        where: { userId: targetUserId },
        select: { browsingHistory: true, purchaseHistory: true },
      });

      const browsedIds = [
        ...(Array.isArray(userProfile?.browsingHistory)
          ? userProfile.browsingHistory
          : []),
        ...(Array.isArray(userProfile?.purchaseHistory)
          ? userProfile.purchaseHistory.flat()
          : []),
      ];

      // Recent search queries (the real activity signal for most users)
      const searchHistory = await prisma.searchHistory.findMany({
        where: { userId: targetUserId },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: { query: true },
      });
      const searchQueries = searchHistory.map((s) => s.query).filter(Boolean);

      // Products the user explicitly browsed (from cart adds)
      const browsedProducts = await prisma.product.findMany({
        where: { id: { in: browsedIds } },
        select: { id: true, name: true, description: true },
      });

      // Products matching the user's search queries (fallback / enrichment)
      const searchMatchedProducts = searchQueries.length
        ? await prisma.product.findMany({
            where: {
              status: "ACTIVE",
              OR: searchQueries.map((q) => ({
                OR: [
                  { name: { contains: q, mode: "insensitive" } },
                  { description: { contains: q, mode: "insensitive" } },
                ],
              })),
            },
            select: { id: true, name: true, description: true },
            take: 20,
          })
        : [];

      // Deduplicate by id, preferring browsed products first
      const seen = new Set();
      const viewedProducts = [...browsedProducts, ...searchMatchedProducts].filter(
        (p) => {
          if (seen.has(p.id)) return false;
          seen.add(p.id);
          return true;
        },
      );

      // Get all active products for recommendations
      const allProducts = await prisma.product.findMany({
        where: { status: "ACTIVE" },
        select: { id: true, name: true, description: true },
      });

      // Generate recommendations for EACH browsing/purchase history product.
      // Each history product becomes the source (productId) and its similar
      // products become the recommended items.
      const recommendationData = [];
      const createdPairs = new Set();

      for (const source of viewedProducts) {
        const aiRecommendations = await generateRecommendations(
          targetUserId,
          [source],
          allProducts,
        );

        for (const rec of aiRecommendations) {
          // Avoid recommending the source product to itself, and avoid duplicates
          if (rec.productId === source.id) continue;
          const pairKey = `${source.id}:${rec.productId}`;
          if (createdPairs.has(pairKey)) continue;
          createdPairs.add(pairKey);

          recommendationData.push({
            userId: targetUserId,
            productId: source.id,
            recommendedProductId: rec.productId,
            score: rec.score,
            reason: rec.reason,
          });
        }
      }

      // Create recommendations inline. Serverless platforms freeze the process
      // once the response is sent, so a setImmediate background write would be
      // dropped; duplicates are skipped per-pair, so re-running is harmless.
      try {
        for (const rec of recommendationData) {
          try {
            await prisma.productRecommendation.create({
              data: rec,
              include: {
                product: { select: { id: true, name: true, images: true, price: true } },
                recommendedTo: { select: { id: true, name: true, images: true, price: true } },
              },
            });
          } catch (e) {
            console.log("Skipping recommendation creation:", rec.recommendedProductId);
          }
        }
      } catch (e) {
        console.error("Recommendation creation failed:", e);
      }

      return NextResponse.json({
        message: "Recommendations generated",
        count: recommendationData.length,
      }, { status: 201 });
    } else {
      // Manual recommendation creation
      let manualUserId = userId;
      if (!manualUserId && email) {
        const matchedUser = await prisma.user.findFirst({
          where: { email: { contains: email, mode: "insensitive" } },
          select: { id: true },
        });
        manualUserId = matchedUser?.id || null;
      }
      if (!manualUserId || !productId || !recommendedProductId || score === undefined) {
        return NextResponse.json(
          { error: "userId or email, productId, recommendedProductId, and score are required" },
          { status: 400 },
        );
      }

      // Create single recommendation
      const recommendation = await prisma.productRecommendation.create({
        data: {
          userId: manualUserId,
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