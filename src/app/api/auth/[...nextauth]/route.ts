import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

// Ensure this route runs on the Node.js runtime since Prisma adapter
// does not support the Edge runtime.
export const runtime = "nodejs";

const handler = NextAuth(authOptions);

// Custom HEAD handler to fix NextAuth HEAD request issues
export async function HEAD(request: NextRequest) {
  // NextAuth doesn't handle HEAD requests properly, so we'll handle them manually
  const url = new URL(request.url);
  
  if (url.pathname.endsWith('/session')) {
    // Return empty response for session HEAD requests
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  }
  
  // For other endpoints, return a generic 200 response
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

export { handler as GET, handler as POST };

