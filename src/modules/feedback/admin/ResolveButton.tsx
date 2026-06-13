"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ResolveButton({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  async function handleClick() {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/feedback/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "resolved" }),
      });
      if (res.ok) {
        router.refresh();
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <span className="inline-flex flex-col items-start gap-0.5">
      <button
        onClick={handleClick}
        disabled={loading}
        className="text-xs text-gray-500 hover:text-green-700 border border-gray-200 rounded px-2 py-1 transition-colors disabled:opacity-50"
      >
        {loading ? "…" : "Als erledigt markieren"}
      </button>
      {error && (
        <span className="text-xs text-red-600">
          Fehlgeschlagen — bitte erneut versuchen
        </span>
      )}
    </span>
  );
}
