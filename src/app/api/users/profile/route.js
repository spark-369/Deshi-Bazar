import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken, extractToken } from "@/lib/auth";
import { generateRecommendations } from "@/lib/ai";

// GET /api/users/profile - Get current user's profile
export async function GET(request) {
  try {
    const authHeader = request.headers.get("authorization");
    console.log(request.url);
    const token = extractToken(authHeader);

    if (!token) {
      return NextsResponse.json(
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
      },
    });

    return NextResponse.json({
      ...userData,
      profile,
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
      phone,
      bio,
      avatar,
      dateOfBirth,
      address,
      city,
      state,
      zipCode,
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
    await prisma.user.update({
      where: { id: decodedUser.id },
      data: {
        name,
        phone,
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
        zipCode,
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
        zipCode,
        country,
        interests: [],
        browsingHistory: [],
        purchaseHistory: [],
        preferences: {},
      },
    });

    return NextResponse.json(profile);
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 },
    );
  }
}

// GET /api/users/profile/recommendations - Get personalized recommendations
export async function recommendations(request) {
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

    // Get user profile with browsing history
    const profile = await prisma.userProfile.findUnique({
      where: { userId: user.id },
    });

    const browsingHistory = profile?.browsingHistory || [];

    // Get viewed products
    let viewedProducts = [];
    if (browsingHistory.length > 0) {
      viewedProducts = await prisma.product.findMany({
        where: {
          id: { in: browsingHistory },
          status: "ACTIVE",
        },
        select: {
          id: true,
          name: true,
          description: true,
        },
      });
    }

    // Get all products for recommendations
    const allProducts = await prisma.product.findMany({
      where: {
        status: "ACTIVE",
        sellerId: { not: user.id }, // Exclude own products
      },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        images: true,
      },
    });

    // Generate AI recommendations
    const recommendations = await generateRecommendations(
      user.id,
      viewedProducts,
      allProducts,
    );

    // Get full product details for recommendations
    const recommendedProducts = await Promise.all(
      recommendations.slice(0, 10).map(async (rec) => {
        return prisma.product.findUnique({
          where: { id: rec.productId },
          include: {
            category: true,
            seller: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        });
      }),
    );

    return NextResponse.json({
      recommendations: recommendedProducts.filter(Boolean),
    });
  } catch (error) {
    console.error("Get recommendations error:", error);
    return NextResponse.json(
      { error: "Failed to get recommendations" },
      { status: 500 },
    );
  }
}
