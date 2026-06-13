import { NextResponse } from "next/server";
import { verifyToken, extractToken } from "@/lib/auth";

export default async function middleware(request) {
  // Get the pathname
  const path = request.nextUrl.pathname;

  // API routes that need authentication
  const protectedPaths = [
    "/api/users/profile",
    "/api/cart",
    "/api/orders",
    "/api/payments",
    "/api/offers",
  ];

  // Admin-only paths
  const adminPaths = ["/api/admin"];

  // Check if path needs authentication
  const needsAuth = protectedPaths.some((p) => path.startsWith(p));
  const needsAdmin = adminPaths.some((p) => path.startsWith(p));

  if (needsAuth || needsAdmin) {
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
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 },
      );
    }

    // Check for admin access
    if (needsAdmin && user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 },
      );
    }

    // Attach user to request headers for API routes
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-user-id", user.id);
    requestHeaders.set("x-user-email", user.email);
    requestHeaders.set("x-user-role", user.role);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
