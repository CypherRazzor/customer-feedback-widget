"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useState } from "react";

interface AnnotationFormProps {
  open: boolean;
  selector: string;
  sessionId: string;
  projectSlug: string;
  pageUrl: string;
  screenshotBase64: string | null;
  onSubmitted: () => void;
  onCancel: () => void;
}

export function AnnotationForm({
  open,
  selector,
  sessionId,
  projectSlug,
  pageUrl,
  screenshotBase64,
  onSubmitted,
  onCancel,
}: AnnotationFormProps) {
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_slug: projectSlug,
          session_id: sessionId,
          page_url: pageUrl,
          css_selector: selector,
          comment: comment.trim(),
          screenshot_base64: screenshotBase64,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Fehler beim Senden");
      }

      setComment("");
      onSubmitted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onCancel()}>
      <Dialog.Portal>
        <Dialog.Overlay
          data-feedback-ui
          className="fixed inset-0 bg-black/30 z-[9999]"
        />
        <Dialog.Content
          data-feedback-ui
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[10000] bg-white rounded-xl shadow-2xl p-6 w-full max-w-md focus:outline-none"
        >
          <Dialog.Title className="text-lg font-semibold text-gray-900 mb-1">
            Feedback hinzufügen
          </Dialog.Title>
          <Dialog.Description className="text-sm text-gray-500 mb-4 font-mono break-all">
            {selector}
          </Dialog.Description>

          <form onSubmit={handleSubmit} className="space-y-4">
            <textarea
              className="w-full border border-gray-300 rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
              placeholder="Was soll geändert werden?"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              disabled={submitting}
              autoFocus
            />

            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={onCancel}
                disabled={submitting}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                disabled={submitting || !comment.trim()}
                className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? "Wird gesendet…" : "Feedback senden"}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
