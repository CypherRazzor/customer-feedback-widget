import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { pool } from "@/lib/db";

// ── GET /api/feedback/analytics ── Admin auth ─────────────────────────────────
export async function GET(req: NextRequest) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const days = parseInt(req.nextUrl.searchParams.get("days") ?? "30", 10);
  const period = [7, 30].includes(days) ? days : 30;

  const [timeSeries, statusBreakdown] = await Promise.all([
    fetchTimeSeries(period),
    fetchStatusBreakdown(period),
  ]);

  return NextResponse.json({ timeSeries, statusBreakdown, period });
}

async function fetchTimeSeries(days: number) {
  const { rows } = await pool.query<{ date: string; count: string }>(
    `SELECT
       TO_CHAR(DATE_TRUNC('day', created_at AT TIME ZONE 'UTC'), 'YYYY-MM-DD') AS date,
       COUNT(*)::text AS count
     FROM feedback_annotations
     WHERE created_at >= NOW() - ($1 * INTERVAL '1 day')
     GROUP BY DATE_TRUNC('day', created_at AT TIME ZONE 'UTC')
     ORDER BY DATE_TRUNC('day', created_at AT TIME ZONE 'UTC') ASC`,
    [days]
  );

  // Fill in missing days with 0
  const today = new Date();
  const filled: { date: string; count: number }[] = [];
  const dataMap = new Map(rows.map((r) => [r.date, parseInt(r.count, 10)]));

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    filled.push({ date: dateStr, count: dataMap.get(dateStr) ?? 0 });
  }

  return filled;
}

async function fetchStatusBreakdown(days: number) {
  const { rows } = await pool.query<{ name: string; value: string }>(
    `SELECT
       CASE
         WHEN resolved_at IS NOT NULL THEN 'Erledigt'
         WHEN confirmed_at IS NOT NULL THEN 'Bestätigt'
         ELSE 'Offen'
       END AS name,
       COUNT(*)::text AS value
     FROM feedback_annotations
     WHERE created_at >= NOW() - ($1 * INTERVAL '1 day')
     GROUP BY 1`,
    [days]
  );

  return rows.map((r) => ({ name: r.name, value: parseInt(r.value, 10) }));
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
