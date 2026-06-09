import { redirect } from "next/navigation";
import { Suspense } from "react";
import { FeedbackDashboard } from "@/modules/feedback/admin/FeedbackDashboard";
import { FeedbackCharts } from "@/modules/feedback/admin/FeedbackCharts";
import { TenantFilter } from "@/modules/feedback/admin/TenantFilter";
import { pool } from "@/lib/db";
import { isAdminAuthorizedServer } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function fetchProjectSlugs(): Promise<string[]> {
  const { rows } = await pool.query<{ project_slug: string }>(
    `SELECT DISTINCT project_slug FROM feedback_annotations ORDER BY project_slug`
  );
  return rows.map((r) => r.project_slug);
}

interface PageProps {
  searchParams: { project_slug?: string };
}

export default async function AdminFeedbackPage({ searchParams }: PageProps) {
  if (!isAdminAuthorizedServer()) {
    redirect("/admin/login");
  }

  const projectSlug = searchParams.project_slug || undefined;
  const slugs = await fetchProjectSlugs();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-800">Feedback Dashboard</h1>
        <div className="flex items-center gap-4">
          <a
            href="/admin/api-keys"
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            API-Keys
          </a>
          <form action="/api/admin/logout" method="POST">
            <button
              type="submit"
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors focus:ring-2 focus:ring-blue-500 rounded"
            >
              Abmelden
            </button>
          </form>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Alle Feedbacks</h2>
            <p className="text-sm text-gray-500 mt-1">
              Feedbacks gruppiert nach Projekt. Offene Einträge werden zuerst angezeigt.
            </p>
          </div>
          <Suspense>
            <TenantFilter slugs={slugs} selected={projectSlug ?? null} />
          </Suspense>
        </div>
        <FeedbackCharts projectSlug={projectSlug} />
        <FeedbackDashboard projectSlug={projectSlug} />
      </main>
    </div>
  );
}
