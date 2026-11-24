import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
]);

const clerk = clerkMiddleware(async (auth, req) => {
  const { pathname } = req.nextUrl;

  // Legacy auth routes now resolve to Clerk's hosted flows.
  if (pathname === "/login" || pathname === "/forgot-password" || pathname === "/reset-password") {
    const url = req.nextUrl.clone();
    url.pathname = "/sign-in";
    return NextResponse.redirect(url);
  }
  if (pathname === "/register") {
    const url = req.nextUrl.clone();
    url.pathname = "/sign-up";
    return NextResponse.redirect(url);
  }

  // Protect everything else: unauthenticated users go to Clerk's sign-in.
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

/**
 * Clerk throws inside its own wrapper when `CLERK_SECRET_KEY` /
 * `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` are empty or from mismatched instances,
 * which otherwise surfaces only as a generic 500. Wrap it so the real error is
 * visible in Workers Observability logs.
 */
export default async function middleware(req: NextRequest, event: NextFetchEvent) {
  try {
    return await clerk(req, event);
  } catch (error) {
    console.error("[middleware] Clerk request failed:", error);
    throw error;
  }
}

export const config = {
  matcher: [
    // `/api/health` must bypass Clerk so it can report missing keys.
    "/((?!api/health|_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest|json|txt|xml)).*)",
    "/((?!api/health)(?:api|trpc))(.*)",
  ],
};
