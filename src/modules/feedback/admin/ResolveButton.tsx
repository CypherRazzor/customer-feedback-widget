"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ResolveButton({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const res = await fetch(`/api/feedback/${id}`, { method: "PATCH" });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="text-xs text-gray-500 hover:text-green-700 border border-gray-200 rounded px-2 py-1 transition-colors disabled:opacity-50"
    >
      {loading ? "…" : "Als erledigt markieren"}
    </button>
  );
}
