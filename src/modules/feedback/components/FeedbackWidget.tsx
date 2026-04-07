"use client";

import { useCallback, useState } from "react";
import { ElementPicker } from "./ElementPicker";
import { AnnotationForm } from "./AnnotationForm";

interface FeedbackWidgetProps {
  projectSlug: string;
  sessionId: string;
}

type WidgetState =
  | { mode: "idle" }
  | { mode: "picking" }
  | { mode: "annotating"; selector: string; screenshot: string | null }
  | { mode: "confirmed" };

/**
 * Main feedback widget. Renders a floating toolbar and orchestrates the
 * pick → screenshot → annotate flow.
 *
 * Wrap with dynamic() + { ssr: false } at the call site.
 */
export function FeedbackWidget({ projectSlug, sessionId }: FeedbackWidgetProps) {
  const [state, setState] = useState<WidgetState>({ mode: "idle" });
  const [feedbackCount, setFeedbackCount] = useState(0);

  const handleElementSelected = useCallback(
    async (selector: string, element: Element) => {
      // Take screenshot of the current viewport via html2canvas
      let screenshot: string | null = null;
      try {
        const html2canvas = (await import("html2canvas")).default;
        const canvas = await html2canvas(document.body, {
          useCORS: true,
          allowTaint: false,
          scale: 0.5, // reduce size
        });
        screenshot = canvas.toDataURL("image/png");
      } catch {
        // Screenshot is optional — proceed without it
      }

      setState({ mode: "annotating", selector, screenshot });
    },
    []
  );

  const handleSubmitted = useCallback(() => {
    setFeedbackCount((c) => c + 1);
    setState({ mode: "idle" });
  }, []);

  const handleConfirm = useCallback(async () => {
    await fetch("/api/feedback/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ project_slug: projectSlug, session_id: sessionId }),
    });
    setState({ mode: "confirmed" });
  }, [projectSlug, sessionId]);

  if (state.mode === "confirmed") {
    return (
      <div
        data-feedback-ui
        className="fixed bottom-6 right-6 z-[9997] bg-green-600 text-white rounded-2xl shadow-xl px-6 py-4 max-w-xs"
      >
        <p className="font-semibold mb-1">Feedback abgeschlossen ✓</p>
        <p className="text-sm text-green-100">
          Vielen Dank! Wir melden uns bei dir.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Floating toolbar */}
      <div
        data-feedback-ui
        className="fixed bottom-6 right-6 z-[9997] flex flex-col gap-2 items-end"
      >
        {feedbackCount > 0 && state.mode === "idle" && (
          <button
            onClick={handleConfirm}
            className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-full shadow-lg transition-colors"
          >
            Feedback abschließen ({feedbackCount})
          </button>
        )}

        <button
          onClick={() =>
            setState((s) =>
              s.mode === "picking" ? { mode: "idle" } : { mode: "picking" }
            )
          }
          className={`flex items-center gap-2 text-sm font-medium px-4 py-3 rounded-full shadow-lg transition-colors ${
            state.mode === "picking"
              ? "bg-blue-700 text-white"
              : "bg-blue-600 hover:bg-blue-700 text-white"
          }`}
        >
          <span>{state.mode === "picking" ? "Abbrechen" : "Feedback geben"}</span>
          <span className="text-lg leading-none">
            {state.mode === "picking" ? "✕" : "💬"}
          </span>
        </button>
      </div>

      {/* Element picker overlay */}
      <ElementPicker
        active={state.mode === "picking"}
        onSelect={handleElementSelected}
      />

      {/* Annotation dialog */}
      <AnnotationForm
        open={state.mode === "annotating"}
        selector={state.mode === "annotating" ? state.selector : ""}
        screenshotBase64={
          state.mode === "annotating" ? state.screenshot : null
        }
        sessionId={sessionId}
        projectSlug={projectSlug}
        pageUrl={typeof window !== "undefined" ? window.location.href : ""}
        onSubmitted={handleSubmitted}
        onCancel={() => setState({ mode: "idle" })}
      />
    </>
  );
}
