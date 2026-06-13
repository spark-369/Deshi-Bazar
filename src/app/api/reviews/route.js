import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken, extractToken } from "@/lib/auth";
import { analyzeSentiment, detectFakeReview } from "@/lib/ai";

// GET /api/reviews - Get reviews for a product
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 10;

    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 },
      );
    }

    const where = { productId };

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.review.count({ where }),
    ]);

    // Calculate average rating
    const allReviews = await prisma.review.findMany({
      where,
      select: { rating: true },
    });

    const avgRating =
      allReviews.length > 0
        ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
        : 0;

    // Filter out fake reviews by default (optional)
    const filteredReviews = reviews.filter((r) => !r.isFake);

    return NextResponse.json({
      reviews: filteredReviews,
      stats: {
        total,
        averageRating: avgRating,
        distribution: {
          5: allReviews.filter((r) => r.rating === 5).length,
          4: allReviews.filter((r) => r.rating === 4).length,
          3: allReviews.filter((r) => r.rating === 3).length,
          2: allReviews.filter((r) => r.rating === 2).length,
          1: allReviews.filter((r) => r.rating === 1).length,
        },
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get reviews error:", error);
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 },
    );
  }
}

// POST /api/reviews - Create a review
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
    if (!user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const body = await request.json();
    const { productId, rating, title, content } = body;

    if (!productId || !rating) {
      return NextResponse.json(
        { error: "Product ID and rating are required" },
        { status: 400 },
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 },
      );
    }

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Check if user already reviewed this product
    const existingReview = await prisma.review.findFirst({
      where: {
        userId: user.id,
        productId,
      },
    });

    if (existingReview) {
      return NextResponse.json(
        { error: "You have already reviewed this product" },
        { status: 409 },
      );
    }

    // Check if user purchased the product
    const order = await prisma.order.findFirst({
      where: {
        userId: user.id,
        status: { in: ["DELIVERED", "CONFIRMED"] },
        items: {
          some: { productId },
        },
      },
    });

    const isVerified = !!order;

    // Analyze sentiment
    const sentimentResult = content
      ? await analyzeSentiment(content)
      : { score: 0, label: "NEUTRAL" };

    // Detect fake review
    const fakeReviewResult = await detectFakeReview(content || "", {
      isVerified,
      userId: user.id,
    });

    // Create review
    const review = await prisma.review.create({
      data: {
        userId: user.id,
        productId,
        rating,
        title,
        content,
        sentimentScore: sentimentResult.score,
        isVerified,
        isFake: fakeReviewResult.isFake,
        fakeScore: fakeReviewResult.fakeScore,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        ...review,
        aiAnalysis: {
          sentiment: sentimentResult,
          fakeDetection: fakeReviewResult,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Create review error:", error);
    return NextResponse.json(
      { error: "Failed to create review" },
      { status: 500 },
    );
  }
}

// PUT /api/reviews - Update a review
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
    if (!user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const body = await request.json();
    const { reviewId, rating, title, content } = body;

    if (!reviewId) {
      return NextResponse.json(
        { error: "Review ID is required" },
        { status: 400 },
      );
    }

    const existingReview = await prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!existingReview) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    if (existingReview.userId !== user.id) {
      return NextResponse.json(
        { error: "Not authorized to update this review" },
        { status: 403 },
      );
    }

    // Re-analyze if content changed
    let sentimentScore = existingReview.sentimentScore;
    let fakeScore = existingReview.fakeScore;

    if (content && content !== existingReview.content) {
      const sentimentResult = await analyzeSentiment(content);
      sentimentScore = sentimentResult.score;

      const fakeResult = await detectFakeReview(content, {});
      fakeScore = fakeResult.fakeScore;
    }

    const review = await prisma.review.update({
      where: { id: reviewId },
      data: {
        rating,
        title,
        content,
        sentimentScore,
        fakeScore,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(review);
  } catch (error) {
    console.error("Update review error:", error);
    return NextResponse.json(
      { error: "Failed to update review" },
      { status: 500 },
    );
  }
}

// DELETE /api/reviews - Delete a review
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
    if (!user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const reviewId = searchParams.get("reviewId");

    if (!reviewId) {
      return NextResponse.json(
        { error: "Review ID is required" },
        { status: 400 },
      );
    }

    const existingReview = await prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!existingReview) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    // Allow deletion by review owner or admin
    if (existingReview.userId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Not authorized to delete this review" },
        { status: 403 },
      );
    }

    await prisma.review.delete({
      where: { id: reviewId },
    });

    return NextResponse.json({ message: "Review deleted successfully" });
  } catch (error) {
    console.error("Delete review error:", error);
    return NextResponse.json(
      { error: "Failed to delete review" },
      { status: 500 },
    );
  }
}
