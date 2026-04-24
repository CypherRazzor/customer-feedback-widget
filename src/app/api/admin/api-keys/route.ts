import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { generateApiKey, hashApiKey } from "@/lib/api-key";
import { isAdminAuthorized } from "@/lib/admin-auth";

// ── GET /api/admin/api-keys ────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { rows } = await pool.query(
    `SELECT id, key_prefix, project_slug, project_name, created_at, revoked_at
     FROM api_keys
     ORDER BY created_at DESC`
  );
  return NextResponse.json(rows);
}

// ── POST /api/admin/api-keys ───────────────────────────────────────────────────
// Creates a new API key. Returns the raw key exactly once.
export async function POST(req: NextRequest) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { project_slug?: string; project_name?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { project_slug, project_name } = body;
  if (!project_slug || !project_name) {
    return NextResponse.json(
      { error: "project_slug and project_name are required" },
      { status: 400 }
    );
  }

  const rawKey = generateApiKey();
  const keyHash = hashApiKey(rawKey);
  const keyPrefix = rawKey.slice(0, 12); // e.g. "wfk_AbCdEfGh"

  const { rows } = await pool.query(
    `INSERT INTO api_keys (key_hash, key_prefix, project_slug, project_name)
     VALUES ($1, $2, $3, $4)
     RETURNING id, key_prefix, project_slug, project_name, created_at`,
    [keyHash, keyPrefix, project_slug, project_name]
  );

  return NextResponse.json({ ...rows[0], key: rawKey }, { status: 201 });
}

// ── DELETE /api/admin/api-keys?id=<uuid> ──────────────────────────────────────
export async function DELETE(req: NextRequest) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id query param required" }, { status: 400 });
  }

  const { rowCount } = await pool.query(
    `UPDATE api_keys SET revoked_at = NOW()
     WHERE id = $1 AND revoked_at IS NULL`,
    [id]
  );

  if (rowCount === 0) {
    return NextResponse.json(
      { error: "Key not found or already revoked" },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true });
}
