import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { pool } from "@/lib/db";

// ── PATCH /api/feedback/:id ── Admin: mark as resolved ────────────────────────
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  let body: { resolved_at?: string | null } = {};
  try {
    body = await req.json();
  } catch {
    // Accept empty body (defaults to marking as resolved now)
  }

  const resolved_at = body.resolved_at === null ? null : new Date().toISOString();

  const { rows } = await pool.query(
    `UPDATE feedback_annotations
     SET resolved_at = $1
     WHERE id = $2
     RETURNING id, resolved_at`,
    [resolved_at, id]
  );

  if (rows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(rows[0]);
}

function isAdminAuthorized(req: NextRequest): boolean {
  const adminSecret = process.env.ADMIN_SECRET;
  if (!adminSecret) return false;

  // Accept Bearer token (for direct API access)
  const auth = req.headers.get("authorization");
  if (auth === `Bearer ${adminSecret}`) return true;

  // Accept httpOnly session cookie (for browser requests from the admin UI)
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
