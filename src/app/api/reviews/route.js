import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken, extractToken } from "@/lib/auth";
import { analyzeSentiment, detectFakeReview, maskBadWords } from "@/lib/ai";

// GET /api/reviews - Get reviews (by productId or user role-based)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 10;

    const authHeader = request.headers.get("authorization");
    const token = extractToken(authHeader);
    let currentUser = null;
    if (token) {
      currentUser = await verifyToken(token);
    }

    const where = {};
    if (productId) {
      where.productId = productId;
    }

    if (currentUser) {
      if (currentUser.role === "ADMIN") {
        // Admin sees all reviews
      } else if (currentUser.role === "SELLER") {
        // Seller sees reviews for their products only
        where.product = {
          sellerId: currentUser.id,
        };
      } else {
        // Buyer sees their own reviews
        where.userId = currentUser.id;
      }
    } else if (!productId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true },
          },
          product: {
            select: {
              id: true,
              name: true,
              images: true,
              category: { select: { name: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.review.count({ where }),
    ]);

    // Return all reviews (positive and negative). Fake/flagged reviews are
    // still shown but surfaced via the "Flagged as Fake" badge on the client.
    // For NEGATIVE reviews, mask offensive ("bad") words using sentiment analysis.
    const reviewsWithMasking = await Promise.all(
      reviews.map(async (r) => {
        const isNegative = r.sentiment === "NEGATIVE";
        const content = isNegative ? await maskBadWords(r.content) : r.content;
        const title = isNegative ? await maskBadWords(r.title) : r.title;

        return {
          id: r.id,
          userId: r.userId,
          productId: r.productId,
          rating: r.rating,
          title,
          comment: content,
          content,
          isVerifiedPurchase: r.isVerified,
          isFlagged: r.isFake,
          helpfulCount: r.helpfulCount || 0,
          response: r.response || null,
          images: r.images || [],
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
          aiAnalysis: {
            sentiment: r.sentiment,
            confidence:
              r.sentimentScore !== null && r.sentimentScore !== undefined
                ? Math.abs(r.sentimentScore)
                : null,
            fakeDetection: {
              isFake: r.isFake,
              fakeScore: r.fakeScore,
            },
          },
          user: r.user,
          product: r.product,
        };
      }),
    );

    return NextResponse.json({
      reviews: reviewsWithMasking,
      stats: {
        total,
        averageRating: 0,
        distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
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

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const existingReview = await prisma.review.findFirst({
      where: { userId: user.id, productId },
    });

    if (existingReview) {
      return NextResponse.json(
        { error: "You have already reviewed this product" },
        { status: 409 },
      );
    }

    const order = await prisma.order.findFirst({
      where: {
        userId: user.id,
        status: { in: ["DELIVERED", "CONFIRMED"] },
        items: { some: { productId } },
      },
    });

    const isVerified = !!order;

    const sentimentResult = content
      ? await analyzeSentiment(
          "Rating: " + rating + "Title: " + title + "Content: " + content,
        )
      : { score: 0, label: "NEUTRAL" };

    const fakeReviewResult = await detectFakeReview(
      "Rating: " + rating + "Title: " + title + "Content: " + content || "",
      {
        isVerified,
        userId: user.id,
      },
    );

    const review = await prisma.review.create({
      data: {
        userId: user.id,
        productId,
        rating,
        title,
        content,
        sentimentScore: sentimentResult.score,
        sentiment: sentimentResult.label,
        isVerified,
        isFake: fakeReviewResult.isFake,
        fakeScore: fakeReviewResult.fakeScore,
      },
      include: {
        user: { select: { id: true, name: true } },
        product: {
          select: {
            id: true,
            name: true,
            images: true,
            category: { select: { name: true } },
          },
        },
      },
    });

    return NextResponse.json(
      {
        ...review,
        isFlagged: review.isFake,
        aiAnalysis: {
          sentiment: review.sentiment,
          confidence: Math.abs(sentimentResult.score),
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

    if (
      existingReview.userId !== user.id &&
      user.role !== "ADMIN"
    ) {
      return NextResponse.json(
        { error: "Not authorized to update this review" },
        { status: 403 },
      );
    }

    let sentimentScore = existingReview.sentimentScore;
    let sentiment = existingReview.sentiment;
    let fakeScore = existingReview.fakeScore;

    if (content && content !== existingReview.content) {
      const sentimentResult = await analyzeSentiment(content);
      sentimentScore = sentimentResult.score;
      sentiment = sentimentResult.label;
      const fakeResult = await detectFakeReview(content, {});
      fakeScore = fakeResult.fakeScore;
    }

    const review = await prisma.review.update({
      where: { id: reviewId },
      data: { rating, title, content, sentimentScore, sentiment, fakeScore },
      include: {
        user: { select: { id: true, name: true } },
        product: {
          select: {
            id: true,
            name: true,
            images: true,
            category: { select: { name: true } },
          },
        },
      },
    });

    return NextResponse.json({
      ...review,
      isFlagged: review.isFake,
      aiAnalysis: {
        sentiment: review.sentiment,
        confidence:
          sentimentScore !== null && sentimentScore !== undefined
            ? Math.abs(sentimentScore)
            : null,
        fakeDetection: { isFake: review.isFake, fakeScore: review.fakeScore },
      },
    });
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

    if (existingReview.userId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Not authorized to delete this review" },
        { status: 403 },
      );
    }

    await prisma.review.delete({ where: { id: reviewId } });

    return NextResponse.json({ message: "Review deleted successfully" });
  } catch (error) {
    console.error("Delete review error:", error);
    return NextResponse.json(
      { error: "Failed to delete review" },
      { status: 500 },
    );
  }
}
