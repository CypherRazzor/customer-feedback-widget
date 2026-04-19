import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { verifyPreviewToken } from "@/lib/preview-token";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-preview-token",
};

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

// ── POST /api/feedback/confirm ── Guest-Token auth ────────────────────────────
// Marks all feedback for this session as confirmed (customer is done).
export async function POST(req: NextRequest) {
  const token = req.headers.get("x-preview-token") ??
    req.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: CORS_HEADERS });
  }

  let verified: { slug: string; sessionId: string };
  try {
    verified = verifyPreviewToken(token);
  } catch {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 401, headers: CORS_HEADERS });
  }

  let body: { project_slug?: string; session_id?: string } = {};
  try {
    body = await req.json();
  } catch {
    // Ignore parse errors; use token values
  }

  const project_slug = body.project_slug ?? verified.slug;
  const session_id = body.session_id ?? verified.sessionId;

  // Validate that token slug matches requested slug (prevent cross-project confirmation)
  if (project_slug !== verified.slug) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403, headers: CORS_HEADERS });
  }

  const { rowCount } = await pool.query(
    `UPDATE feedback_annotations
     SET confirmed_at = NOW()
     WHERE project_slug = $1
       AND session_id = $2
       AND confirmed_at IS NULL`,
    [project_slug, session_id]
  );

  return NextResponse.json({ confirmed: rowCount ?? 0 }, { headers: CORS_HEADERS });
}
