import { createHmac, timingSafeEqual } from "crypto";

/**
 * A preview token encodes: projectSlug + sessionId, signed with HMAC-SHA256.
 * Format: base64url(JSON({ slug, sessionId, exp })).HMAC
 */

interface TokenPayload {
  slug: string;
  sessionId: string;
  exp: number; // Unix timestamp (seconds)
}

function getSecret(): string {
  const secret = process.env.PREVIEW_TOKEN_SECRET;
  if (!secret) throw new Error("PREVIEW_TOKEN_SECRET is not set");
  return secret;
}

function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

export function createPreviewToken(
  slug: string,
  sessionId: string,
  ttlSeconds = 30 * 24 * 60 * 60 // 30 days
): string {
  const payload: TokenPayload = {
    slug,
    sessionId,
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = sign(encoded);
  return `${encoded}.${sig}`;
}

export interface VerifiedToken {
  slug: string;
  sessionId: string;
}

export function verifyPreviewToken(token: string): VerifiedToken {
  const parts = token.split(".");
  if (parts.length !== 2) throw new Error("Invalid token format");
  const [encoded, sig] = parts;

  const expectedSig = sign(encoded);
  if (
    !timingSafeEqual(
      Buffer.from(sig, "base64url"),
      Buffer.from(expectedSig, "base64url")
    )
  ) {
    throw new Error("Invalid token signature");
  }

  const payload: TokenPayload = JSON.parse(
    Buffer.from(encoded, "base64url").toString("utf8")
  );

  if (Date.now() / 1000 > payload.exp) {
    throw new Error("Token expired");
  }

  return { slug: payload.slug, sessionId: payload.sessionId };
}
