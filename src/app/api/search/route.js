import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken, extractToken } from "@/lib/auth";
import { getAISearchSuggestions, generateEmbedding } from "@/lib/ai";

// GET /api/search - Search products with AI
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const categoryId = searchParams.get("categoryId");
    const minPriceParam = searchParams.get("minPrice");
    const maxPriceParam = searchParams.get("maxPrice");
    const minPrice = minPriceParam ? parseFloat(minPriceParam) : 0;
    const maxPrice = maxPriceParam ? parseFloat(maxPriceParam) : null;
    const isNegotiable = searchParams.get("isNegotiable");
    const sortBy = searchParams.get("sortBy") || "relevance";
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 20;
    const suggestionsOnly = searchParams.get("suggestions") === "true";
    const aiSearch = searchParams.get("ai") === "true";

    // Get user for personalized search (optional auth)
    const authHeader = request.headers.get("authorization");
    const token = extractToken(authHeader);
    const user = token ? await verifyToken(token) : null;

    // If just getting suggestions
    if (suggestionsOnly && query) {
      // Get all product names for matching
      const products = await prisma.product.findMany({
        where: { status: "ACTIVE" },
        select: { name: true },
        take: 1000,
      });

      const productNames = products.map((p) => p.name);
      const aiSuggestions = await getAISearchSuggestions(query, productNames);

      return NextResponse.json({
        suggestions: aiSuggestions,
      });
    }

    // Build search query
    let where = {
      status: "ACTIVE",
      price: {
        gte: minPrice,
      },
    };

    // Only add lte if maxPrice is provided and valid
    if (maxPrice !== null && !isNaN(maxPrice)) {
      where.price.lte = maxPrice;
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (isNegotiable !== null) {
      where.isNegotiable = isNegotiable === "true";
    }

    // Text search with embeddings (semantic search)
    if (query && query.length >= 2) {
      // Generate embedding for query
      const queryEmbedding = await generateEmbedding(query);

      // Simple text search as fallback
      where.OR = [
        { name: { contains: query } },
        { description: { contains: query } },
      ];
    }

    // Get products
    let products = await prisma.product.findMany({
      where,
      include: {
        category: true,
        seller: {
          select: {
            id: true,
            name: true,
          },
        },
        reviews: {
          select: { rating: true },
        },
      },
      take: limit,
      skip: (page - 1) * limit,
    });

    // If we have a query embedding, re-rank by semantic similarity
    if (query && query.length >= 2) {
      const queryEmbedding = await generateEmbedding(query);

      if (queryEmbedding) {
        products = products.map((product) => {
          let relevanceScore = 0;

          if (product.embedding) {
            try {
              const productEmbedding = JSON.parse(product.embedding);
              relevanceScore = productEmbedding.reduce(
                (sum, val, i) => sum + val * queryEmbedding[i],
                0,
              );
            } catch (e) {
              // Use text matching as fallback
              const nameMatch = product.name
                .toLowerCase()
                .includes(query.toLowerCase());
              const descMatch = product.description
                ?.toLowerCase()
                .includes(query.toLowerCase());
              relevanceScore = nameMatch ? 0.5 : descMatch ? 0.3 : 0;
            }
          }

          return { ...product, relevanceScore };
        });

        // Sort by relevance
        if (sortBy === "relevance") {
          products.sort((a, b) => b.relevanceScore - a.relevanceScore);
        }
      }
    }

    // Apply other sorting
    if (sortBy === "price_asc") {
      products.sort((a, b) => a.price - b.price);
    } else if (sortBy === "price_desc") {
      products.sort((a, b) => b.price - a.price);
    } else if (sortBy === "newest") {
      products.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortBy === "rating") {
      products.sort((a, b) => {
        const aRating =
          a.reviews.length > 0
            ? a.reviews.reduce((sum, r) => sum + r.rating, 0) / a.reviews.length
            : 0;
        const bRating =
          b.reviews.length > 0
            ? b.reviews.reduce((sum, r) => sum + r.rating, 0) / b.reviews.length
            : 0;
        return bRating - aRating;
      });
    }

    // Calculate ratings
    const productsWithRating = products.map((product) => {
      const avgRating =
        product.reviews.length > 0
          ? product.reviews.reduce((sum, r) => sum + r.rating, 0) /
            product.reviews.length
          : 0;

      return {
        ...product,
        averageRating: avgRating,
        reviewCount: product.reviews.length,
      };
    });

    // Get total count
    const total = await prisma.product.count({ where });

    // Save search history if user is authenticated
    if (user) {
      await prisma.searchHistory.create({
        data: {
          userId: user.id,
          query,
          resultsCount: products.length,
        },
      });
    }

    // Get AI suggestions for autocomplete
    const aiSuggestions = query
      ? await getAISearchSuggestions(
          query,
          products.map((p) => p.name),
        )
      : [];

    return NextResponse.json({
      products: productsWithRating,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      aiSuggestions,
      aiPowered: aiSearch || (query && query.length >= 2),
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
