import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { verifyApiKey } from "@/lib/api-key";
import { createPreviewToken } from "@/lib/preview-token";
import { rateLimit } from "@/lib/rate-limit";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-api-key",
};

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

// ── POST /api/widget/token ─────────────────────────────────────────────────────
// Exchanges a project API key for a short-lived preview token.
// The widget calls this on init when data-api-key is provided instead of data-token.
export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!rateLimit(`widget-token:${ip}`, 30)) {
    return NextResponse.json(
      { error: "Too Many Requests" },
      { status: 429, headers: CORS_HEADERS }
    );
  }

  const apiKey = req.headers.get("x-api-key");
  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing x-api-key header" },
      { status: 401, headers: CORS_HEADERS }
    );
  }

  const tenant = await verifyApiKey(apiKey);
  if (!tenant) {
    return NextResponse.json(
      { error: "Invalid or revoked API key" },
      { status: 401, headers: CORS_HEADERS }
    );
  }

  const sessionId = randomUUID();
  // Short-lived token: 1 hour, since a new one is fetched per page load
  const token = createPreviewToken(tenant.project_slug, sessionId, 60 * 60);

  return NextResponse.json(
    { token, project_slug: tenant.project_slug, session_id: sessionId },
    { status: 200, headers: CORS_HEADERS }
  );
}
