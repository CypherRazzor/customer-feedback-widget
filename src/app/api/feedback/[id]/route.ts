import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { isAdminAuthorized } from "@/lib/admin-auth";

// ── PATCH /api/feedback/:id ── Admin: update status and/or assignee ───────────
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  let body: { status?: string; assignee?: string } = {};
  try {
    body = await req.json();
  } catch {
    // empty body is accepted
  }

  const validStatuses = ["open", "in_progress", "resolved"];
  if (body.status !== undefined && !validStatuses.includes(body.status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const updates: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (body.status !== undefined) {
    updates.push(`status = $${idx++}`);
    values.push(body.status);

    // Keep resolved_at in sync for backwards compatibility
    if (body.status === "resolved") {
      updates.push(`resolved_at = $${idx++}`);
      values.push(new Date().toISOString());
    } else {
      updates.push(`resolved_at = $${idx++}`);
      values.push(null);
    }

    // Keep confirmed_at in sync
    if (body.status === "in_progress") {
      updates.push(`confirmed_at = COALESCE(confirmed_at, $${idx++})`);
      values.push(new Date().toISOString());
    } else if (body.status === "open") {
      updates.push(`confirmed_at = $${idx++}`);
      values.push(null);
    }
  }

  if (body.assignee !== undefined) {
    updates.push(
      `metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('assignee', $${idx++}::text)`
    );
    values.push(body.assignee);
  }

  if (updates.length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  values.push(id);
  const { rows } = await pool.query(
    `UPDATE feedback_annotations SET ${updates.join(", ")} WHERE id = $${idx} RETURNING id, status, resolved_at, metadata`,
    values
  );

  if (rows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(rows[0]);
}
