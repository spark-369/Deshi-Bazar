"use client";

import dynamic from "next/dynamic";

// Recharts is a heavy client-only dependency. Loading it on demand keeps it
// out of the shared bundle so other routes stay small — important for staying
// within Vercel's free-tier function and bundle limits.
export default dynamic(() => import("./FullAnalyticsContent"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  ),
});

