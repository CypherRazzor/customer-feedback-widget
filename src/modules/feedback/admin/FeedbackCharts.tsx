"use client";

import { useState, useEffect, useCallback } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";

interface TimePoint {
  date: string;
  count: number;
}

interface StatusCount {
  name: string;
  value: number;
}

interface AnalyticsData {
  timeSeries: TimePoint[];
  statusBreakdown: StatusCount[];
  period: number;
}

interface FeedbackChartsProps {
  projectSlug?: string;
}

const STATUS_COLORS: Record<string, string> = {
  Offen: "#f59e0b",
  Bestätigt: "#3b82f6",
  Erledigt: "#10b981",
};

function formatDate(dateStr: string, period: number): string {
  const d = new Date(dateStr);
  if (period <= 7) {
    return d.toLocaleDateString("de-DE", { weekday: "short", day: "numeric", month: "numeric" });
  }
  return d.toLocaleDateString("de-DE", { day: "numeric", month: "short" });
}

export function FeedbackCharts({ projectSlug }: FeedbackChartsProps) {
  const [period, setPeriod] = useState<7 | 30>(30);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (p: number) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ days: String(p) });
      if (projectSlug) params.set("project_slug", projectSlug);
      const res = await fetch(`/api/feedback/analytics?${params}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: AnalyticsData = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler beim Laden");
    } finally {
      setLoading(false);
    }
  }, [projectSlug]);

  useEffect(() => {
    fetchData(period);
  }, [period, projectSlug, fetchData]);

  const chartData = data?.timeSeries.map((p) => ({
    ...p,
    label: formatDate(p.date, period),
  })) ?? [];

  return (
    <section
      className="mb-8 bg-white border border-gray-200 rounded-lg p-6 shadow-sm"
      aria-label="Feedback-Analytics"
    >
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h2 className="text-base font-semibold text-gray-800">
          Trend-Analyse
          {projectSlug && (
            <span className="ml-2 text-sm font-normal text-gray-400 font-mono">
              ({projectSlug})
            </span>
          )}
        </h2>
        <div className="flex gap-2" role="group" aria-label="Zeitraum auswählen">
          {([7, 30] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                period === p
                  ? "bg-blue-600 text-white border-blue-600"
                  : "text-gray-600 border-gray-300 hover:border-blue-400 hover:text-blue-600"
              }`}
              aria-pressed={period === p}
            >
              {p} Tage
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
          Daten werden geladen…
        </div>
      )}

      {error && (
        <div className="flex items-center justify-center h-48 text-red-500 text-sm">
          {error}
        </div>
      )}

      {!loading && !error && data && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Line Chart: submissions over time */}
          <div>
            <p className="text-sm font-medium text-gray-600 mb-3">
              Einreichungen über Zeit
            </p>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData} margin={{ top: 4, right: 16, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "#6b7280" }}
                  interval={period === 30 ? 4 : 0}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: "#6b7280" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 6 }}
                  formatter={(v) => [`${v} Einreichung(en)`, "Feedback"]}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Bar Chart: status breakdown */}
          <div>
            <p className="text-sm font-medium text-gray-600 mb-3">
              Status-Verteilung
            </p>
            {data.statusBreakdown.length === 0 ? (
              <div className="flex items-center justify-center h-[220px] text-gray-400 text-sm">
                Keine Daten im Zeitraum
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={data.statusBreakdown}
                  margin={{ top: 4, right: 16, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12, fill: "#6b7280" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: "#6b7280" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 6 }}
                    formatter={(v) => [`${v}`, "Anzahl"]}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {data.statusBreakdown.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={STATUS_COLORS[entry.name] ?? "#94a3b8"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
            <div className="flex gap-4 mt-2 flex-wrap">
              {Object.entries(STATUS_COLORS).map(([name, color]) => (
                <span key={name} className="flex items-center gap-1.5 text-xs text-gray-500">
                  <span
                    className="inline-block w-3 h-3 rounded-sm"
                    style={{ backgroundColor: color }}
                  />
                  {name}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
