import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken, extractToken, generate2FACode } from "@/lib/auth";
import { send2FACode } from "@/lib/email";

// POST /api/users/2fa - Enable 2FA (send verification code)
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

    const code = generate2FACode();
    const expires = new Date();
    expires.setMinutes(expires.getMinutes() + 5);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorCode: code,
        twoFactorExpires: expires,
      },
    });

    await send2FACode(user.email, code);

    return NextResponse.json({
      message: "2FA verification code sent to your email",
      email: user.email,
    });
  } catch (error) {
    console.error("Enable 2FA error:", error);
    return NextResponse.json(
      { error: "Failed to enable 2FA" },
      { status: 500 },
    );
  }
}

// DELETE /api/users/2fa - Disable 2FA
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

    const decodedUser = await verifyToken(token);
    if (!decodedUser) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: decodedUser.id },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!user.twoFactorEnabled) {
      return NextResponse.json(
        { error: "Two-factor authentication is not enabled" },
        { status: 400 },
      );
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorEnabled: false,
        twoFactorCode: null,
        twoFactorExpires: null,
      },
    });

    return NextResponse.json({
      message: "Two-factor authentication disabled successfully",
    });
  } catch (error) {
    console.error("Disable 2FA error:", error);
    return NextResponse.json(
      { error: "Failed to disable 2FA" },
      { status: 500 },
    );
  }
}
