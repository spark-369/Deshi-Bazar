import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken, extractToken } from "@/lib/auth";

// GET /api/search/history - recent distinct queries for the authenticated user
export async function GET(request) {
  try {
    const token = extractToken(request.headers.get("authorization"));
    if (!token) return NextResponse.json({ searches: [] });

    const user = await verifyToken(token);
    if (!user) return NextResponse.json({ searches: [] });

    const history = await prisma.searchHistory.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { query: true },
    });

    const seen = new Set();
    const searches = [];
    for (const h of history) {
      if (h.query && !seen.has(h.query)) {
        seen.add(h.query);
        searches.push(h.query);
      }
    }

    return NextResponse.json({ searches });
  } catch (error) {
    console.error("Recent searches error:", error);
    return NextResponse.json({ searches: [] });
  }
}

// DELETE /api/search/history - clear the authenticated user's search history
export async function DELETE(request) {
  try {
    const token = extractToken(request.headers.get("authorization"));
    if (!token) return NextResponse.json({ ok: true });

    const user = await verifyToken(token);
    if (!user) return NextResponse.json({ ok: true });

    await prisma.searchHistory.deleteMany({ where: { userId: user.id } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Clear recent searches error:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
