import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { timingSafeEqual } from "crypto";
import { FeedbackDashboard } from "@/modules/feedback/admin/FeedbackDashboard";
import { FeedbackCharts } from "@/modules/feedback/admin/FeedbackCharts";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function isAdminAuthenticated(): boolean {
  const adminSecret = process.env.ADMIN_SECRET;
  if (!adminSecret) return false;
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get("admin_session")?.value ?? "";
  try {
    return timingSafeEqual(Buffer.from(sessionCookie), Buffer.from(adminSecret));
  } catch {
    return false;
  }
}

export default function AdminFeedbackPage() {
  if (!isAdminAuthenticated()) {
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-800">
          Feedback Dashboard
        </h1>
        <form action="/api/admin/logout" method="POST">
          <button
            type="submit"
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Abmelden
          </button>
        </form>
      </header>
      <main className="max-w-5xl mx-auto px-6 py-8">
        <FeedbackCharts />
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Alle Feedbacks
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Feedbacks gruppiert nach Projekt. Offene Einträge werden zuerst angezeigt.
          </p>
        </div>
        <FeedbackDashboard />
      </main>
    </div>
  );
}
