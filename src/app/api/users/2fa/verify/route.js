import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken, extractToken } from "@/lib/auth";

// POST /api/users/2fa/verify - Verify 2FA code and enable 2FA
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

    const decodedUser = await verifyToken(token);
    if (!decodedUser) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const body = await request.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json(
        { error: "Verification code is required" },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: decodedUser.id },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.twoFactorEnabled) {
      return NextResponse.json(
        { error: "Two-factor authentication is already enabled" },
        { status: 400 },
      );
    }

    if (!user.twoFactorCode || !user.twoFactorExpires) {
      return NextResponse.json(
        { error: "No active 2FA session. Please request a new code." },
        { status: 400 },
      );
    }

    if (new Date() > new Date(user.twoFactorExpires)) {
      return NextResponse.json(
        { error: "Verification code has expired. Please request a new code." },
        { status: 400 },
      );
    }

    if (user.twoFactorCode !== code) {
      return NextResponse.json(
        { error: "Invalid verification code" },
        { status: 400 },
      );
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorEnabled: true,
        twoFactorCode: null,
        twoFactorExpires: null,
      },
    });

    return NextResponse.json({
      message: "Two-factor authentication enabled successfully",
    });
  } catch (error) {
    console.error("Verify 2FA error:", error);
    return NextResponse.json(
      { error: "Failed to verify 2FA code" },
      { status: 500 },
    );
  }
}
