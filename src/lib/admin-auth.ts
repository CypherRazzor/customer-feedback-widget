import { timingSafeEqual } from "crypto";
import { cookies, headers } from "next/headers";
import type { NextRequest } from "next/server";

// For use in Server Components (reads cookies/headers via next/headers).
// Next.js 15: cookies() and headers() are async.
export async function isAdminAuthorizedServer(): Promise<boolean> {
  const adminSecret = process.env.ADMIN_SECRET;
  if (!adminSecret) return false;

  const auth = (await headers()).get("authorization");
  if (auth?.startsWith("Bearer ")) {
    const token = auth.slice(7);
    try {
      const tokenBuf = Buffer.from(token);
      const secretBuf = Buffer.from(adminSecret);
      if (tokenBuf.length === secretBuf.length) {
        return timingSafeEqual(tokenBuf, secretBuf);
      }
    } catch {
      // fall through to cookie check
    }
  }

  const session = (await cookies()).get("admin_session")?.value ?? "";
  try {
    const sessionBuf = Buffer.from(session);
    const secretBuf = Buffer.from(adminSecret);
    return (
      session.length > 0 &&
      sessionBuf.length === secretBuf.length &&
      timingSafeEqual(sessionBuf, secretBuf)
    );
  } catch {
    return false;
  }
}

// For use in API Route Handlers (reads cookies/headers from NextRequest).
export function isAdminAuthorized(req: NextRequest): boolean {
  const adminSecret = process.env.ADMIN_SECRET;
  if (!adminSecret) return false;

  // Accept Bearer token for direct API access
  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) {
    const token = auth.slice(7);
    try {
      const tokenBuf = Buffer.from(token);
      const secretBuf = Buffer.from(adminSecret);
      if (tokenBuf.length === secretBuf.length) {
        return timingSafeEqual(tokenBuf, secretBuf);
      }
    } catch {
      // fall through to cookie check
    }
  }

  // Accept httpOnly session cookie for browser requests
  const session = req.cookies.get("admin_session")?.value ?? "";
  try {
    const sessionBuf = Buffer.from(session);
    const secretBuf = Buffer.from(adminSecret);
    return (
      session.length > 0 &&
      sessionBuf.length === secretBuf.length &&
      timingSafeEqual(sessionBuf, secretBuf)
    );
  } catch {
    return false;
  }
}
