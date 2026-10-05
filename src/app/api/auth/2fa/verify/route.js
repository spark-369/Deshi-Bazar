import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken, extractToken, generateToken, generate2FACode } from "@/lib/auth";
import { send2FACode } from "@/lib/email";

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

    const decoded = await verifyToken(token);
    if (!decoded || !decoded.pending2FA) {
      return NextResponse.json(
        { error: "Invalid or expired 2FA session" },
        { status: 401 },
      );
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
      where: { id: decoded.id },
      include: { profile: true },
    });

    if (!user || !user.twoFactorEnabled) {
      return NextResponse.json(
        { error: "Two-factor authentication is not enabled for this account" },
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
        twoFactorCode: null,
        twoFactorExpires: null,
      },
    });

    const fullToken = await generateToken(user);
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json({
      user: userWithoutPassword,
      token: fullToken,
    });
  } catch (error) {
    console.error("2FA verify error:", error);
    return NextResponse.json(
      { error: "Failed to verify 2FA code" },
      { status: 500 },
    );
  }
}
