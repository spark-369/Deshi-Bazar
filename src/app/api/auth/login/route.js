import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { comparePassword, generateToken, generate2FATempToken, generate2FACode } from "@/lib/auth";
import { send2FACode } from "@/lib/email";

const MAX_DEVICES = 2;

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

/**
 * Enforce the max-device rule on the User.devices JSON array.
 * Returns the updated array, or throws if the limit would be exceeded.
 */
async function enforceDeviceLimit(userId, userAgent) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { devices: true },
  });

  const currentDevices = Array.isArray(user?.devices) ? user.devices : [];

  // Same device re-login → refresh lastLoginAt
  const existingIndex = currentDevices.findIndex(
    (d) => d.userAgent === userAgent,
  );

  if (existingIndex !== -1) {
    currentDevices[existingIndex].lastLoginAt = new Date().toISOString();
    await prisma.user.update({
      where: { id: userId },
      data: { devices: currentDevices },
    });
    return currentDevices;
  }

  // New device – reject if already at max capacity
  if (currentDevices.length >= MAX_DEVICES) {
    throw new Error(
      `You have reached the maximum of ${MAX_DEVICES} allowed devices. Please log out from another device first.`,
    );
  }

  // Append the new device entry
  const newEntry = {
    userAgent,
    lastLoginAt: new Date().toISOString(),
  };
  const updatedDevices = [...currentDevices, newEntry];

  await prisma.user.update({
    where: { id: userId },
    data: { devices: updatedDevices },
  });

  return updatedDevices;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password, phone, latitude, longitude } = body;

    if (!email || !password || !phone) {
      return NextResponse.json(
        { error: "Email, password, and phone are required" },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { email, phone },
      include: { profile: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 },
      );
    }

    const isValidPassword = await comparePassword(password, user.password);

    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 },
      );
    }

    const userAgent = getUserAgent(request);

    // Enforce 2-device limit (rejects login if a 3rd distinct device is used)
    try {
      await enforceDeviceLimit(user.id, userAgent);
    } catch (deviceError) {
      return NextResponse.json({ error: deviceError.message }, { status: 403 });
    }

    // Update user lat/lng and phone if provided
    if (
      latitude !== undefined ||
      longitude !== undefined ||
      phone !== undefined
    ) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          ...(latitude !== undefined && { latitude }),
          ...(longitude !== undefined && { longitude }),
          ...(phone !== undefined && { phone: phone || null }),
        },
      });
    }

    // If 2FA is enabled, send code and return temp token
    if (user.twoFactorEnabled) {
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

      return NextResponse.json({
        requires2FA: true,
        email: user.email,
        tempToken,
        user: userWithoutPassword,
      });
    }

    const token = await generateToken(user);
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json({
      user: userWithoutPassword,
      token,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to login: " + error.message },
      { status: 500 },
    );
  }
}
