import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { isAdminAuthorized } from "@/lib/admin-auth";

// ── GET /api/feedback/analytics ── Admin auth ─────────────────────────────────
export async function GET(req: NextRequest) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const days = parseInt(req.nextUrl.searchParams.get("days") ?? "30", 10);
  const period = [7, 30].includes(days) ? days : 30;
  const slug = req.nextUrl.searchParams.get("project_slug") ?? null;

  const [timeSeries, statusBreakdown] = await Promise.all([
    fetchTimeSeries(period, slug),
    fetchStatusBreakdown(period, slug),
  ]);

  return NextResponse.json({ timeSeries, statusBreakdown, period, project_slug: slug });
}

async function fetchTimeSeries(days: number, slug: string | null) {
  const params: (number | string)[] = [days];
  const slugFilter = slug ? `AND project_slug = $${params.push(slug)}` : "";

  const { rows } = await pool.query<{ date: string; count: string }>(
    `SELECT
       TO_CHAR(DATE_TRUNC('day', created_at AT TIME ZONE 'UTC'), 'YYYY-MM-DD') AS date,
       COUNT(*)::text AS count
     FROM feedback_annotations
     WHERE created_at >= NOW() - ($1 * INTERVAL '1 day') ${slugFilter}
     GROUP BY DATE_TRUNC('day', created_at AT TIME ZONE 'UTC')
     ORDER BY DATE_TRUNC('day', created_at AT TIME ZONE 'UTC') ASC`,
    params
  );

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

async function fetchStatusBreakdown(days: number, slug: string | null) {
  const params: (number | string)[] = [days];
  const slugFilter = slug ? `AND project_slug = $${params.push(slug)}` : "";

  const { rows } = await pool.query<{ name: string; value: string }>(
    `SELECT
       CASE
         WHEN resolved_at IS NOT NULL THEN 'Erledigt'
         WHEN confirmed_at IS NOT NULL THEN 'Bestätigt'
         ELSE 'Offen'
       END AS name,
       COUNT(*)::text AS value
     FROM feedback_annotations
     WHERE created_at >= NOW() - ($1 * INTERVAL '1 day') ${slugFilter}
     GROUP BY 1`,
    params
  );

  return rows.map((r) => ({ name: r.name, value: parseInt(r.value, 10) }));
}
