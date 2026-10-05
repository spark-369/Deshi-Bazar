import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken, extractToken } from "@/lib/auth";

export async function GET(request) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = extractToken(authHeader);
    
    // Optional auth - public for seller lists, but auth recommended
    const user = token ? await verifyToken(token) : null;
    
    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role"); // e.g., ?role=SELLER
    
    const where = role ? { role } : {};
    
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        profile: {
          select: {
            address: true,
            city: true,
            division: true,
            district: true,
            postalCode: true,
            zipCode: true,
            country: true,
          },
        },
      },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("Get users error:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

