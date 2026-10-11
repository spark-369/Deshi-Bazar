import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken, extractToken, generate2FACode } from "@/lib/auth";
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

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user || !user.twoFactorEnabled) {
      return NextResponse.json(
        { error: "Two-factor authentication is not enabled for this account" },
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
      message: "2FA code sent successfully",
      email: user.email,
    });
  } catch (error) {
    console.error("2FA send error:", error);
    return NextResponse.json(
      { error: "Failed to send 2FA code" },
      { status: 500 },
    );
  }
}
