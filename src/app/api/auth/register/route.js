import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hashPassword, generateToken } from "@/lib/auth";

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
