import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Tokens are currently stored in localStorage (client-side), so middleware
 * cannot read them. This middleware only handles the `/` -> `/dashboard`
 * redirect.
 *
 * Upgrade path: move access/refresh tokens to httpOnly cookies set by the
 * backend (or a Next.js route handler proxy). Then check the cookie here and
 * redirect unauthenticated users to `/login` for protected routes.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/"],
};
