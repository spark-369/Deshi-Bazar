import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken, extractToken } from "@/lib/auth";

// GET /api/users/profile - Get current user's profile
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
    if (!user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const profile = await prisma.userProfile.findUnique({
      where: { userId: user.id },
    });

    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        isVerified: true,
        createdAt: true,
        twoFactorEnabled: true,
      },
    });

    const [orderCount, customOrderCount, wishlistCount, reviewCount, regularTotal, customTotal] = await Promise.all([
      prisma.order.count({ where: { userId: user.id } }),
      prisma.customOrder.count({ where: { userId: user.id } }),
      prisma.wishlist.count({ where: { userId: user.id } }),
      prisma.review.count({ where: { userId: user.id } }),
      prisma.order.aggregate({
        where: { userId: user.id, status: { not: "CANCELLED" } },
        _sum: { total: true },
      }),
      prisma.customOrder.aggregate({
        where: { userId: user.id, status: { not: "CANCELLED" } },
        _sum: { total: true },
      }),
    ]);

    const stats = {
      orders: orderCount + customOrderCount,
      wishlist: wishlistCount,
      reviews: reviewCount,
      totalSpent: (regularTotal._sum.total || 0) + (customTotal._sum.total || 0),
    };

    return NextResponse.json({
      ...userData,
      profile: {
        ...profile,
        ...stats,
      },
    });
  } catch (error) {
    console.error("Get profile error:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 },
    );
  }
}

// PUT /api/users/profile - Update current user's profile
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

    const decodedUser = await verifyToken(token);
    if (!decodedUser) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      email,
      phone,
      bio,
      avatar,
      dateOfBirth,
      address,
      city,
      state,
      division,
      district,
      zipCode,
      postalCode,
      country,
      action,
      currentPassword,
      newPassword,
    } = body;

    // Handle password change
    if (action === "changePassword") {
      if (!currentPassword || !newPassword) {
        return NextResponse.json(
          { error: "Current and new password are required" },
          { status: 400 },
        );
      }

      // Get user with password
      const userWithPassword = await prisma.user.findUnique({
        where: { id: decodedUser.id },
      });

      // Verify current password
      const bcrypt = await import("bcryptjs");
      const isValid = await bcrypt.compare(
        currentPassword,
        userWithPassword.password,
      );

      if (!isValid) {
        return NextResponse.json(
          { error: "Current password is incorrect" },
          { status: 400 },
        );
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password
      await prisma.user.update({
        where: { id: decodedUser.id },
        data: { password: hashedPassword },
      });

      return NextResponse.json({ message: "Password changed successfully" });
    }

    // Update user basic info
    const updatedUser = await prisma.user.update({
      where: { id: decodedUser.id },
      data: {
        name,
        email,
        phone,
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        isVerified: true,
        createdAt: true,
        twoFactorEnabled: true,
      },
    });

    // Update profile
    const profile = await prisma.userProfile.upsert({
      where: { userId: decodedUser.id },
      update: {
        bio,
        avatar,
        dateOfBirth,
        address,
        city,
        state,
        division,
        district,
        zipCode,
        postalCode,
        country,
      },
      create: {
        userId: decodedUser.id,
        bio,
        avatar,
        dateOfBirth,
        address,
        city,
        state,
        division,
        district,
        zipCode,
        postalCode,
        country,
        interests: [],
        browsingHistory: [],
        purchaseHistory: [],
        preferences: {},
      },
    });

    const [orderCount, customOrderCount, wishlistCount, reviewCount, regularTotal, customTotal] = await Promise.all([
      prisma.order.count({ where: { userId: decodedUser.id } }),
      prisma.customOrder.count({ where: { userId: decodedUser.id } }),
      prisma.wishlist.count({ where: { userId: decodedUser.id } }),
      prisma.review.count({ where: { userId: decodedUser.id } }),
      prisma.order.aggregate({
        where: { userId: decodedUser.id, status: { not: "CANCELLED" } },
        _sum: { total: true },
      }),
      prisma.customOrder.aggregate({
        where: { userId: decodedUser.id, status: { not: "CANCELLED" } },
        _sum: { total: true },
      }),
    ]);

    const stats = {
      orders: orderCount + customOrderCount,
      wishlist: wishlistCount,
      reviews: reviewCount,
      totalSpent: (regularTotal._sum.total || 0) + (customTotal._sum.total || 0),
    };

    return NextResponse.json({
      ...updatedUser,
      profile: {
        ...profile,
        ...stats,
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 },
    );
  }
}
