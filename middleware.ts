import { NextRequest, NextResponse } from "next/server";

// Routes that are always public (no preview token needed)
const PUBLIC_PATHS = [
  "/api/auth",
  "/admin",
  "/_next",
  "/favicon.ico",
];

// API routes that require a preview token (handled inside the route handlers)
const PREVIEW_API_PATHS = ["/api/feedback"];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/") || pathname.startsWith(p));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // Preview pages require a token query parameter
  if (pathname.startsWith("/preview") || pathname === "/") {
    const token = request.nextUrl.searchParams.get("token");
    if (!token && pathname.startsWith("/preview")) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // For preview API routes, forward the token from the cookie or query
  if (PREVIEW_API_PATHS.some((p) => pathname.startsWith(p))) {
    // Token validation is handled inside the route handlers
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|images|icons|fonts).*)"],
};
