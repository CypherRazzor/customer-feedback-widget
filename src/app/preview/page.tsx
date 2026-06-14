import { redirect } from "next/navigation";
import { existsSync } from "fs";
import path from "path";
import { verifyPreviewToken } from "@/lib/preview-token";
import { FeedbackWidgetLoader } from "./FeedbackWidgetLoader";

interface Props {
  searchParams: Promise<{ token?: string }>;
}

function hasStaticPreview(slug: string): boolean {
  const previewPath = path.join(
    process.cwd(),
    "public",
    "previews",
    slug,
    "index.html"
  );
  return existsSync(previewPath);
}

export default async function PreviewPage({ searchParams }: Props) {
  const { token } = await searchParams;

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
  const staticPreviewAvailable = hasStaticPreview(slug);
  const iframeSrc = staticPreviewAvailable
    ? `/previews/${slug}/index.html`
    : null;

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Slim header bar */}
      <header className="bg-white border-b border-gray-200 px-5 py-2.5 flex items-center justify-between flex-shrink-0 z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-sm text-gray-600">
            Vorschau:{" "}
            <span className="font-semibold text-gray-900">{slug}</span>
          </span>
        </div>
        <p className="text-xs text-gray-400 hidden sm:block">
          💬 Element anklicken → Feedback hinterlassen
        </p>
      </header>

      {/* Preview area */}
      <div className="flex-1 relative overflow-hidden">
        {iframeSrc ? (
          // Same-origin iframe — widget can screenshot across it
          <iframe
            src={iframeSrc}
            className="w-full h-full border-0"
            title={`Preview: ${slug}`}
            // same-origin so no sandbox needed; html2canvas can capture it
          />
        ) : (
          // Fallback: no static preview available
          <div className="flex items-center justify-center h-full bg-gray-50">
            <div className="max-w-lg mx-auto bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
              <h1 className="text-xl font-semibold text-gray-800 mb-3">
                Vorschau — {slug}
              </h1>
              <p className="text-gray-500 text-sm">
                Nutze das Feedback-Widget unten rechts, um Änderungswünsche
                zu hinterlassen.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Feedback widget — floats above everything incl. iframe */}
      <FeedbackWidgetLoader
        projectSlug={slug}
        sessionId={sessionId}
        token={token}
        iframeSrc={iframeSrc ?? undefined}
      />
    </div>
  );
}
