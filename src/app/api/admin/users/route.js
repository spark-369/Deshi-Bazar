import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken, extractToken } from "@/lib/auth";
import { predictChurn } from "@/lib/ai";

// GET /api/admin/users - Get all users for admin
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
    const role = searchParams.get("role");
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 20;

    const where = {};
    if (role) where.role = role;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          role: true,
          isVerified: true,
          createdAt: true,
          profile: {
            select: {
              totalSpent: true,
              purchaseCount: true,
              lastPurchaseDate: true,
            },
          },
          _count: {
            select: {
              orders: true,
              reviews: true,
              offers: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    // Get churn predictions for high-value users
    const usersWithChurn = await Promise.all(
      users.map(async (u) => {
        let churnPrediction = null;

        // Only predict for buyers with significant history
        if (u.role === "BUYER" && u.profile?.purchaseCount > 0) {
          const daysSinceLastActivity = u.profile?.lastPurchaseDate
            ? Math.floor(
                (Date.now() - new Date(u.profile.lastPurchaseDate).getTime()) /
                  (1000 * 60 * 60 * 24),
              )
            : 999;

          churnPrediction = await predictChurn({
            daysSinceLastActivity,
            purchaseFrequencyTrend: "stable",
            avgSessionTime: 300,
          });
        }

        return {
          ...u,
          churnPrediction,
        };
      }),
    );

    return NextResponse.json({
      users: usersWithChurn,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get admin users error:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 },
    );
  }
}

// PUT /api/admin/users - Update user (role, verification)
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

    const adminUser = await verifyToken(token);
    if (!adminUser || adminUser.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { userId, action, data } = body;

    if (!userId || !action) {
      return NextResponse.json(
        { error: "User ID and action are required" },
        { status: 400 },
      );
    }

    switch (action) {
      case "updateRole":
        if (!data?.role) {
          return NextResponse.json(
            { error: "Role is required" },
            { status: 400 },
          );
        }

        await prisma.user.update({
          where: { id: userId },
          data: { role: data.role },
        });
        break;

      case "verify":
        await prisma.user.update({
          where: { id: userId },
          data: { isVerified: true },
        });
        break;

      case "unverify":
        await prisma.user.update({
          where: { id: userId },
          data: { isVerified: false },
        });
        break;

      case "ban":
        // Soft ban - change role
        await prisma.user.update({
          where: { id: userId },
          data: { role: "BUYER" }, // Downgrade role
        });
        break;

      case "delete":
        // Hard delete user (will cascade delete related data due to onDelete: Cascade)
        await prisma.user.delete({
          where: { id: userId },
        });
        break;

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({ message: "User updated successfully" });
  } catch (error) {
    console.error("Update admin user error:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 },
    );
  }
}

// DELETE /api/admin/users - Delete a user (Admin only)
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
    const userId = searchParams.get("id");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 },
      );
    }

    // Prevent admin from deleting themselves
    if (userId === user.id) {
      return NextResponse.json(
        { error: "Cannot delete your own account" },
        { status: 400 },
      );
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        _count: {
          select: {
            orders: true,
            products: true,
            reviews: true,
          },
        },
      },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 },
      );
    }

    // Delete user (cascade will handle related data)
    await prisma.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Delete admin user error:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 },
    );
  }
}
