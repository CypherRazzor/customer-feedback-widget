import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { verifyPreviewToken } from "@/lib/preview-token";
import { uploadScreenshot } from "@/lib/storage";
import { isAdminAuthorized } from "@/lib/admin-auth";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-preview-token",
};

// ── OPTIONS — preflight for cross-origin widget requests ──────────────────────
export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

// ── POST /api/feedback ── Guest-Token auth ────────────────────────────────────
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

  let body: {
    project_slug?: string;
    session_id?: string;
    page_url?: string;
    css_selector?: string;
    comment?: string;
    screenshot_base64?: string;
    metadata?: Record<string, unknown>;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400, headers: CORS_HEADERS });
  }

  const { page_url, css_selector, comment, screenshot_base64, metadata } = body;

  if (!page_url || !comment) {
    return NextResponse.json(
      { error: "page_url and comment are required" },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  // Use slug and sessionId from the verified token (not from request body)
  const { slug: project_slug, sessionId: session_id } = verified;

  let screenshot_url: string | null = null;
  if (screenshot_base64) {
    try {
      screenshot_url = await uploadScreenshot(screenshot_base64, project_slug);
    } catch (err) {
      console.error("Screenshot upload failed:", err);
      // Non-fatal: save feedback without screenshot
    }
  }

  const { rows } = await pool.query(
    `INSERT INTO feedback_annotations
       (project_slug, session_id, page_url, css_selector, comment, screenshot_url, metadata)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, created_at`,
    [
      project_slug,
      session_id,
      page_url,
      css_selector ?? null,
      comment,
      screenshot_url,
      metadata ? JSON.stringify(metadata) : null,
    ]
  );

  return NextResponse.json(rows[0], { status: 201, headers: CORS_HEADERS });
}

// ── GET /api/feedback ── Admin auth ───────────────────────────────────────────
export async function GET(req: NextRequest) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const slug = req.nextUrl.searchParams.get("project_slug");
  const includeResolved = req.nextUrl.searchParams.get("resolved") === "1";

  let query = `SELECT * FROM feedback_annotations`;
  const params: (string | boolean)[] = [];

  const conditions: string[] = [];
  if (slug) {
    params.push(slug);
    conditions.push(`project_slug = $${params.length}`);
  }
  if (!includeResolved) {
    conditions.push(`resolved_at IS NULL`);
  }

  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(" AND ")}`;
  }
  query += ` ORDER BY created_at DESC`;

  const { rows } = await pool.query(query, params);
  return NextResponse.json(rows);
}

