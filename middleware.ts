import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Tokens are stored in localStorage (client-side), so middleware cannot read
 * them. Route guarding is handled client-side in src/app/page.tsx:
 *   - Authenticated users are redirected to /dashboard
 *   - Unauthenticated users are redirected to /login
 *
 * This middleware is reserved for future server-side auth checks once tokens
 * move to httpOnly cookies.
 */
export function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/"],
};
