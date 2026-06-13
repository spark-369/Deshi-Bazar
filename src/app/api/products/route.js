import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken, extractToken } from "@/lib/auth";
import { generateEmbedding, suggestNegotiationPrice } from "@/lib/ai";

// GET /api/products - List all products with filtering
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    // Filter parameters
    const categoryId = searchParams.get("categoryId");
    const sellerId = searchParams.get("sellerId");
    const minPrice = parseFloat(searchParams.get("minPrice")) || 0;
    const maxPriceParam = searchParams.get("maxPrice");
    const maxPrice = maxPriceParam ? parseFloat(maxPriceParam) : null;
    const isNegotiable = searchParams.get("isNegotiable");
    const status = searchParams.get("status") || "ACTIVE";
    const search = searchParams.get("search");
    const productType = searchParams.get("productType");
    const isOrganic = searchParams.get("isOrganic");
    const freshness = searchParams.get("freshness");
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 20;
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    // Build where clause
    const where = {
      status,
      price: {
        gte: minPrice,
      },
    };

    // Only add lte if maxPrice is provided and valid
    if (maxPrice !== null && !isNaN(maxPrice)) {
      where.price.lte = maxPrice;
    }

    if (categoryId) where.categoryId = categoryId;
    if (sellerId) where.sellerId = sellerId;
    if (isNegotiable !== null) where.isNegotiable = isNegotiable === "true";
    if (productType) where.productType = productType;
    if (isOrganic !== null) where.isOrganic = isOrganic === "true";
    if (freshness) where.freshness = freshness;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
      ];
    }

    // Get total count
    const total = await prisma.product.count({ where });

    // Get products with pagination
    const products = await prisma.product.findMany({
      where,
      include: {
        category: true,
        seller: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        reviews: {
          select: {
            rating: true,
          },
        },
      },
      orderBy: {
        [sortBy]: sortOrder,
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Calculate average ratings
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

    return NextResponse.json({
      products: productsWithRating,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get products error:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 },
    );
  }
}

// POST /api/products - Create a new product
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
    if (!user || user.role !== "SELLER") {
      return NextResponse.json(
        { error: "Only sellers can create products" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const {
      name,
      description,
      images,
      price,
      originalPrice,
      stock,
      categoryId,
      isNegotiable,
      estimatedDeliveryDays,
      tags,
      // Grocery-specific fields
      productType,
      unit,
      weight,
      expiryDate,
      isOrganic,
      freshness,
    } = body;

    // Validate required fields
    if (!name || !price || !categoryId) {
      return NextResponse.json(
        { error: "Name, price, and category are required" },
        { status: 400 },
      );
    }

    // Generate embedding for semantic search
    const embedding = await generateEmbedding(
      `${name} ${description || ""} ${tags?.join(" ") || ""}`,
    );

    // Calculate AI-suggested price range for negotiation
    const priceSuggestion = await suggestNegotiationPrice(price, price * 0.85);

    // Create product
    const product = await prisma.product.create({
      data: {
        sellerId: user.id,
        categoryId,
        name,
        description,
        images: images || [],
        price,
        originalPrice,
        stock: stock || 0,
        isNegotiable: isNegotiable || false,
        minAcceptablePrice: priceSuggestion.minAcceptable,
        maxAcceptablePrice: priceSuggestion.maxAcceptable,
        estimatedDeliveryDays,
        tags: tags || [],
        embedding: embedding ? JSON.stringify(embedding) : null,
        // Grocery-specific fields
        productType: productType || 'REGULAR',
        unit,
        weight,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        isOrganic: isOrganic || false,
        freshness,
      },
      include: {
        category: true,
        seller: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("Create product error:", error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 },
    );
  }
}
