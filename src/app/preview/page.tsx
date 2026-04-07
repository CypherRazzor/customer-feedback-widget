import { redirect } from "next/navigation";
import dynamic from "next/dynamic";
import { verifyPreviewToken } from "@/lib/preview-token";

// Lazy-load the widget — only rendered client-side
const FeedbackWidget = dynamic(
  () =>
    import("@/modules/feedback/components/FeedbackWidget").then(
      (m) => m.FeedbackWidget
    ),
  { ssr: false }
);

interface Props {
  searchParams: { token?: string; slug?: string };
}

export default function PreviewPage({ searchParams }: Props) {
  const { token } = searchParams;

  if (!token) {
    redirect("/");
  }

  let verified: { slug: string; sessionId: string };
  try {
    verified = verifyPreviewToken(token);
  } catch {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8">
          <h1 className="text-2xl font-semibold text-red-700 mb-2">
            Link ungültig oder abgelaufen
          </h1>
          <p className="text-gray-500">
            Bitte fordere einen neuen Preview-Link an.
          </p>
        </div>
      </main>
    );
  }

  const { slug, sessionId } = verified;

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Preview header */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-sm text-gray-600">
            Preview:{" "}
            <span className="font-medium text-gray-800">{slug}</span>
          </span>
        </div>
        <p className="text-xs text-gray-400">
          Klicke auf ein Element, um Feedback zu geben
        </p>
      </div>

      {/* Preview content area */}
      <div className="p-8">
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h1 className="text-2xl font-semibold text-gray-800 mb-4">
            Vorschau — {slug}
          </h1>
          <p className="text-gray-500">
            Hier siehst du die aktuelle Vorschau deines Projekts. Nutze das
            Feedback-Widget unten rechts, um Änderungswünsche direkt auf der
            Seite zu markieren.
          </p>
        </div>
      </div>

      {/* Feedback widget (client-side only) */}
      <FeedbackWidget projectSlug={slug} sessionId={sessionId} />
    </main>
  );
}
