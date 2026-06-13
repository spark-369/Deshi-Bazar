import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/categories - List all categories
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeProducts = searchParams.get("includeProducts") === "true";
    const parentId = searchParams.get("parentId");
    const name = searchParams.get("name");
    const all = searchParams.get("all") === "true";

    let where = {
      isActive: true,
    };

    if (parentId) {
      where.parentId = parentId;
    } else if (!name && !all) {
      // Default: only top-level categories if no filters
      where.parentId = null;
    }

    if (name) {
      where.name = {
        equals: name,
        mode: "insensitive",
      };
    }

    const categories = await prisma.category.findMany({
      where,
      include: {
        children: {
          where: { isActive: true },
        },
        ...(includeProducts && {
          products: {
            where: { status: "ACTIVE" },
            take: 10,
          },
        }),
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error("Get categories error:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 },
    );
  }
}

// POST /api/categories - Create a new category (Admin only)
export async function POST(request) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.substring(7);

    // Import verifyToken dynamically to avoid issues
    const { verifyToken } = await import("@/lib/auth");
    const user = token ? await verifyToken(token) : null;

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { name, description, image, parentId } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Category name is required" },
        { status: 400 },
      );
    }

    // Check if category with same name exists
    const existing = await prisma.category.findUnique({
      where: { name },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Category with this name already exists" },
        { status: 409 },
      );
    }

    // If parentId provided, verify parent exists
    if (parentId) {
      const parent = await prisma.category.findUnique({
        where: { id: parentId },
      });

      if (!parent) {
        return NextResponse.json(
          { error: "Parent category not found" },
          { status: 404 },
        );
      }
    }

    const category = await prisma.category.create({
      data: {
        name,
        description,
        image,
        parentId,
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("Create category error:", error);
    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 },
    );
  }
}

// PUT /api/categories - Update a category (Admin only)
export async function PUT(request) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.substring(7);

    const { verifyToken } = await import("@/lib/auth");
    const user = token ? await verifyToken(token) : null;

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { id, name, description, image, parentId, isActive } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Category ID is required" },
        { status: 400 },
      );
    }

    // Check if category exists
    const existing = await prisma.category.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 },
      );
    }

    // Check if name is being changed and if it conflicts
    if (name && name !== existing.name) {
      const nameConflict = await prisma.category.findUnique({
        where: { name },
      });
      if (nameConflict) {
        return NextResponse.json(
          { error: "Category with this name already exists" },
          { status: 409 },
        );
      }
    }

    // If parentId provided, verify parent exists
    if (parentId) {
      const parent = await prisma.category.findUnique({
        where: { id: parentId },
      });
      if (!parent) {
        return NextResponse.json(
          { error: "Parent category not found" },
          { status: 404 },
        );
      }
      // Prevent setting itself as parent
      if (parentId === id) {
        return NextResponse.json(
          { error: "Category cannot be its own parent" },
          { status: 400 },
        );
      }
    }

    const category = await prisma.category.update({
      where: { id },
      data: {
        name,
        description,
        image,
        parentId: parentId || null,
        isActive: isActive !== undefined ? isActive : undefined,
      },
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error("Update category error:", error);
    return NextResponse.json(
      { error: "Failed to update category" },
      { status: 500 },
    );
  }
}

// DELETE /api/categories - Delete a category (Admin only)
export async function DELETE(request) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.substring(7);

    const { verifyToken } = await import("@/lib/auth");
    const user = token ? await verifyToken(token) : null;

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
        { error: "Category ID is required" },
        { status: 400 },
      );
    }

    // Check if category exists
    const existing = await prisma.category.findUnique({
      where: { id },
      include: {
        children: true,
        products: true,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 },
      );
    }

    // Check if category has children
    if (existing.children && existing.children.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete category with subcategories. Remove subcategories first." },
        { status: 400 },
      );
    }

    // Check if category has products
    if (existing.products && existing.products.length > 0) {
      // Instead of deleting, just deactivate
      await prisma.category.update({
        where: { id },
        data: { isActive: false },
      });
      return NextResponse.json({ message: "Category deactivated (has products)" });
    }

    // Delete the category
    await prisma.category.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error("Delete category error:", error);
    return NextResponse.json(
      { error: "Failed to delete category" },
      { status: 500 },
    );
  }
}
