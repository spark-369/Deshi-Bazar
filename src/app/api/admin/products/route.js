import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken, extractToken } from "@/lib/auth";

// GET /api/admin/products - Get all products for admin
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
    const status = searchParams.get("status");
    const sellerId = searchParams.get("sellerId");
    const categoryId = searchParams.get("categoryId");
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 20;

    const where = {};

    if (status) where.status = status;
    if (sellerId) where.sellerId = sellerId;
    if (categoryId) where.categoryId = categoryId;

    const [products, total] = await Promise.all([
      prisma.product.findMany({
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
            select: { rating: true },
          },
          _count: {
            select: {
              offers: true,
              cartItems: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    const productsWithStats = products.map((product) => {
      const avgRating =
        product.reviews.length > 0
          ? product.reviews.reduce((sum, r) => sum + r.rating, 0) /
            product.reviews.length
          : 0;

      return {
        ...product,
        averageRating: avgRating,
        reviewCount: product.reviews.length,
        offerCount: product._count.offers,
        cartCount: product._count.cartItems,
      };
    });

    return NextResponse.json({
      products: productsWithStats,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get admin products error:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 },
    );
  }
}

// PUT /api/admin/products - Bulk update product status
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
    const { productIds, action, data } = body;

    if (!productIds || !action) {
      return NextResponse.json(
        { error: "Product IDs and action are required" },
        { status: 400 },
      );
    }

    switch (action) {
      case "updateStatus":
        if (!data?.status) {
          return NextResponse.json(
            { error: "Status is required" },
            { status: 400 },
          );
        }

        await prisma.product.updateMany({
          where: { id: { in: productIds } },
          data: { status: data.status },
        });
        break;

      case "delete":
        // Soft delete
        await prisma.product.updateMany({
          where: { id: { in: productIds } },
          data: { status: "DELETED" },
        });
        break;

      case "feature":
        // Add featured tag
        await prisma.product.updateMany({
          where: { id: { in: productIds } },
          data: {
            tags: {
              push: "featured",
            },
          },
        });
        break;

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({ message: "Products updated successfully" });
  } catch (error) {
    console.error("Update admin products error:", error);
    return NextResponse.json(
      { error: "Failed to update products" },
      { status: 500 },
    );
  }
}

// POST /api/admin/products - Create a new product (Admin only)
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
    const {
      name,
      description,
      images,
      price,
      originalPrice,
      stock,
      categoryId,
      sellerId,
      isNegotiable,
      estimatedDeliveryDays,
      tags,
      status,
    } = body;

    if (!name || !price || !categoryId || !sellerId) {
      return NextResponse.json(
        { error: "Name, price, category, and seller are required" },
        { status: 400 },
      );
    }

    // Verify seller exists
    const seller = await prisma.user.findUnique({
      where: { id: sellerId },
    });

    if (!seller) {
      return NextResponse.json(
        { error: "Seller not found" },
        { status: 404 },
      );
    }

    // Verify category exists
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 },
      );
    }

    const product = await prisma.product.create({
      data: {
        sellerId,
        categoryId,
        name,
        description,
        images: images || [],
        price,
        originalPrice,
        stock: stock || 0,
        isNegotiable: isNegotiable || false,
        estimatedDeliveryDays,
        tags: tags || [],
        status: status || "ACTIVE",
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
    console.error("Create admin product error:", error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 },
    );
  }
}

// DELETE /api/admin/products - Delete products (Admin only)
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
    const productId = searchParams.get("id");

    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 },
      );
    }

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        _count: {
          select: {
            orderItems: true,
            cartItems: true,
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 },
      );
    }

    // If product has orders, just mark as deleted instead of hard delete
    if (product._count.orderItems > 0) {
      await prisma.product.update({
        where: { id: productId },
        data: { status: "DELETED" },
      });
      return NextResponse.json({ message: "Product marked as deleted (has orders)" });
    }

    // Hard delete if no orders
    await prisma.product.delete({
      where: { id: productId },
    });

    return NextResponse.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Delete admin product error:", error);
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 },
    );
  }
}
