import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken, extractToken } from "@/lib/auth";
import { generateEmbedding } from "@/lib/ai";

// GET /api/admin/products/[id] - Get single product for admin
export async function GET(request, { params }) {
  try {
    const { id } = await params;
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

    const product = await prisma.product.findUnique({
      where: { id },
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
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Calculate average rating
    const avgRating =
      product.reviews.length > 0
        ? product.reviews.reduce((sum, r) => sum + r.rating, 0) /
          product.reviews.length
        : 0;

    return NextResponse.json({
      ...product,
      averageRating: avgRating,
      reviewCount: product.reviews.length,
      offerCount: product._count.offers,
      cartCount: product._count.cartItems,
    });
  } catch (error) {
    console.error("Get admin product error:", error);
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 },
    );
  }
}

// PUT /api/admin/products/[id] - Update product (Admin only)
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
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

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
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
      status,
      estimatedDeliveryDays,
      tags,
    } = body;

    // Generate new embedding if name/description/tags changed
    let embedding = existingProduct.embedding;
    if (name || description || tags) {
      const newName = name || existingProduct.name;
      const newDesc = description || existingProduct.description || "";
      const newTags = tags || existingProduct.tags || [];
      const newEmbedding = await generateEmbedding(
        `${newName} ${newDesc} ${Array.isArray(newTags) ? newTags.join(" ") : newTags}`,
      );
      embedding = newEmbedding
        ? JSON.stringify(newEmbedding)
        : existingProduct.embedding;
    }

    // Update product
    const product = await prisma.product.update({
      where: { id },
      data: {
        name,
        description,
        images,
        price,
        originalPrice,
        stock,
        categoryId,
        sellerId,
        isNegotiable,
        status,
        estimatedDeliveryDays,
        tags,
        embedding,
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

    return NextResponse.json(product);
  } catch (error) {
    console.error("Update admin product error:", error);
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 },
    );
  }
}

// DELETE /api/admin/products/[id] - Delete product (Admin only)
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
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

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id },
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
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // If product has orders, just mark as deleted instead of hard delete
    if (product._count.orderItems > 0) {
      await prisma.product.update({
        where: { id },
        data: { status: "DELETED" },
      });
      return NextResponse.json({ message: "Product marked as deleted (has orders)" });
    }

    // Hard delete if no orders
    await prisma.product.delete({
      where: { id },
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