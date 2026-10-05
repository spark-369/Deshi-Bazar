import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken, extractToken } from "@/lib/auth";
import { generateEmbedding } from "@/lib/ai";

// GET /api/search - Search products
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

    // Get user for personalized search (optional auth)
    const authHeader = request.headers.get("authorization");
    const token = extractToken(authHeader);
    const user = token ? await verifyToken(token) : null;

    // If just getting suggestions - use simple text matching for speed
    if (suggestionsOnly && query) {
      const products = await prisma.product.findMany({
        where: {
          status: "ACTIVE",
          name: { contains: query, mode: "insensitive" },
        },
        select: { name: true },
        take: 100,
      });

      return NextResponse.json({
        suggestions: products.map((p) => p.name),
      });
    }

    // Build base filters. Search is relevance-ranked (no strict substring filter) —
    // candidates are ranked by embedding similarity from the lightweight,
    // dependency-free feature-hashed embedding in generateEmbedding().
    let where = {
      status: "ACTIVE",
      price: {
        gte: minPrice,
      },
    };

    if (maxPrice !== null && !isNaN(maxPrice)) {
      where.price.lte = maxPrice;
    }
    if (categoryId) {
      where.categoryId = categoryId;
    }
    if (isNegotiable !== null) {
      where.isNegotiable = isNegotiable === "true";
    }

    const include = {
      category: true,
      seller: { select: { id: true, name: true } },
      reviews: { select: { rating: true } },
    };

    const queryEmbedding =
      query && query.length >= 2 ? await generateEmbedding(query) : null;

    let products;

    if (query && queryEmbedding) {
      // Fetch candidates then rank by a combination of text overlap and
      // embedding similarity. Text matches are authoritative (so a legitimate
      // keyword match is always returned), while embedding similarity
      // acts as a ranking booster for related-product relevance. This avoids the
      // previous bug where sparse, feature-hashed embeddings produced zero or
      // negative dot products for genuinely matching products and everything was
      // filtered out by `relevanceScore > 0`.
      const candidates = await prisma.product.findMany({ where, include });
      const q = query.toLowerCase();
      const queryTokens = q.split(/[^a-z0-9]+/).filter(Boolean);

      products = candidates
        .map((product) => {
          const name = product.name?.toLowerCase() || "";
          const description = product.description?.toLowerCase() || "";
          const tags = (Array.isArray(product.tags) ? product.tags : [])
            .join(" ")
            .toLowerCase();
          const searchable = `${name} ${description} ${tags}`;

          // Authoritative text matching: token-level overlap so partial and
          // multi-word queries still match (not just exact substring).
          let textScore = 0;
          if (q.length >= 2) {
            if (searchable.includes(q)) {
              textScore = 0.6;
            } else if (queryTokens.length > 0) {
              const matchedTokens = queryTokens.filter((t) =>
                searchable.includes(t),
              ).length;
              textScore = matchedTokens / queryTokens.length;
            }
          }

          // Embedding similarity from stored vector (optional booster).
          let semanticScore = 0;
          if (product.embedding) {
            try {
              const productEmbedding = JSON.parse(product.embedding);
              semanticScore = productEmbedding.reduce(
                (sum, val, i) => sum + val * (queryEmbedding[i] || 0),
                0,
              );
            } catch (e) {
              semanticScore = 0;
            }
          }

          const relevanceScore = textScore
            ? 1 + textScore + Math.max(0, semanticScore)
            : Math.max(0, semanticScore);

          return { ...product, relevanceScore };
        })
        .filter((p) => p.relevanceScore > 0);

      if (sortBy === "relevance") {
        products.sort((a, b) => b.relevanceScore - a.relevanceScore);
      }
    } else if (query) {
      // Embedding model unavailable: fall back to case-insensitive substring match.
      products = (
        await prisma.product.findMany({
          where: {
            ...where,
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { description: { contains: query, mode: "insensitive" } },
            ],
          },
          include,
        })
      ).map((p) => ({ ...p, relevanceScore: 0 }));
    } else {
      // No query: return the catalogue (DB-paginated).
      products = await prisma.product.findMany({
        where,
        include,
        take: limit,
        skip: (page - 1) * limit,
      });
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

    // Pagination + total (ranked results are sliced in memory)
    let total;
    let pagedProducts;
    if (query) {
      total = productsWithRating.length;
      const start = (page - 1) * limit;
      pagedProducts = productsWithRating.slice(start, start + limit);
    } else {
      total = await prisma.product.count({ where });
      pagedProducts = productsWithRating;
    }

    // Save search history if user is authenticated. Awaited inline: serverless
    // platforms freeze the process once the response is sent, so setImmediate
    // background writes would be dropped.
    if (user && query) {
      try {
        await prisma.searchHistory.create({
          data: {
            userId: user.id,
            query,
            resultsCount: total,
          },
        });
      } catch (e) {
        console.error("Search history save failed:", e);
      }
    }

    return NextResponse.json({
      products: pagedProducts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
