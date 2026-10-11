import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hashPassword, generateToken, generate2FATempToken, generate2FACode } from "@/lib/auth";
import { send2FACode } from "@/lib/email";

function getUserAgent(request) {
  return request.headers.get("user-agent") || "unknown";
}

function getClientIp(request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      email,
      password,
      name,
      phone,
      role = "BUYER",
      latitude,
      longitude,
      enable2FA = true,
    } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 },
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 },
      );
    }

    const hashedPassword = await hashPassword(password);
    const userAgent = getUserAgent(request);
    const ipAddress = getClientIp(request);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        phone,
        role: role.toUpperCase(),
        twoFactorEnabled: enable2FA,
        ...(latitude !== undefined && { latitude: latitude ?? null }),
        ...(longitude !== undefined && { longitude: longitude ?? null }),
        // Store the first device's userAgent directly on the User record
        devices: [
          {
            userAgent,
            ipAddress: ipAddress || null,
            lastLoginAt: new Date().toISOString(),
          },
        ],
        profile: {
          create: {
            interests: [],
            browsingHistory: [],
            purchaseHistory: [],
            preferences: {},
          },
        },
      },
      include: {
        profile: true,
      },
    });

    // If 2FA is enabled, send code and return temp token
    if (enable2FA) {
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

      const tempToken = await generate2FATempToken(user);
      const { password: _, ...userWithoutPassword } = user;

      return NextResponse.json(
        {
          requires2FA: true,
          email: user.email,
          tempToken,
          user: userWithoutPassword,
        },
        { status: 201 },
      );
    }

    const token = await generateToken(user);
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json(
      {
        user: userWithoutPassword,
        token,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Failed to register user" },
      { status: 500 },
    );
  }
}
