"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface ApiKeyRow {
  id: string;
  key_prefix: string;
  project_slug: string;
  project_name: string;
  created_at: string;
  revoked_at: string | null;
}

export default function ApiKeysPage() {
  const router = useRouter();
  const [keys, setKeys] = useState<ApiKeyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Create form state
  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);

  const loadKeys = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/api-keys");
    if (res.status === 401) {
      router.push("/admin/login");
      return;
    }
    if (!res.ok) {
      setError("Fehler beim Laden der API-Keys.");
      setLoading(false);
      return;
    }
    setKeys(await res.json());
    setLoading(false);
  }, [router]);

  useEffect(() => {
    loadKeys();
  }, [loadKeys]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setNewKey(null);
    setError("");
    const res = await fetch("/api/admin/api-keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ project_slug: slug, project_name: name }),
    });
    if (!res.ok) {
      setError("Erstellen fehlgeschlagen.");
      setCreating(false);
      return;
    }
    const data = await res.json();
    setNewKey(data.key);
    setSlug("");
    setName("");
    setCreating(false);
    loadKeys();
  }

  async function handleRevoke(id: string) {
    if (!confirm("API-Key wirklich widerrufen?")) return;
    const res = await fetch(`/api/admin/api-keys?id=${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError((data as { error?: string }).error ?? "Widerrufen fehlgeschlagen.");
      return;
    }
    loadKeys();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-800">API-Key Verwaltung</h1>
        <div className="flex items-center gap-4">
          <a href="/admin/feedback" className="text-sm text-blue-600 hover:text-blue-800">
            Feedback Dashboard
          </a>
          <form action="/api/admin/logout" method="POST">
            <button type="submit" className="text-sm text-gray-500 hover:text-gray-700">
              Abmelden
            </button>
          </form>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8 space-y-8">
        {/* Create form */}
        <section className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">
            Neuen API-Key erstellen
          </h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Projekt-Slug
                </label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                  placeholder="mein-projekt"
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Projektname
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Mein Projekt"
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={creating}
              className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {creating ? "Erstelle…" : "API-Key erstellen"}
            </button>
          </form>

          {newKey && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm font-semibold text-green-800 mb-1">
                Neuer API-Key — nur einmal angezeigt:
              </p>
              <code className="block text-xs font-mono break-all text-green-900 bg-green-100 rounded p-2">
                {newKey}
              </code>
              <p className="text-xs text-green-700 mt-2">
                Diesen Key sicher speichern — er wird nicht erneut angezeigt.
              </p>
            </div>
          )}
        </section>

        {/* Key list */}
        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-3">
            Vorhandene API-Keys
          </h2>
          {loading ? (
            <p className="text-sm text-gray-500">Lade…</p>
          ) : keys.length === 0 ? (
            <p className="text-sm text-gray-400">Noch keine API-Keys vorhanden.</p>
          ) : (
            <div className="space-y-2">
              {keys.map((k) => (
                <div
                  key={k.id}
                  className={`bg-white border rounded-lg px-4 py-3 flex items-center justify-between gap-4 ${
                    k.revoked_at ? "border-gray-100 opacity-50" : "border-gray-200"
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-sm text-gray-800">
                        {k.key_prefix}…
                      </span>
                      {k.revoked_at ? (
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">
                          Widerrufen
                        </span>
                      ) : (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                          Aktiv
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 mt-0.5">
                      {k.project_name}{" "}
                      <span className="text-gray-400 font-mono text-xs">({k.project_slug})</span>
                    </p>
                    <p className="text-xs text-gray-400">
                      Erstellt: {new Date(k.created_at).toLocaleString("de-DE")}
                    </p>
                  </div>
                  {!k.revoked_at && (
                    <button
                      onClick={() => handleRevoke(k.id)}
                      className="text-xs text-red-500 hover:text-red-700 border border-red-200 rounded px-2 py-1 flex-shrink-0"
                    >
                      Widerrufen
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Embed snippet */}
        <section className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-2">
            Einbindung
          </h2>
          <p className="text-sm text-gray-600 mb-3">
            Ersetze <code className="bg-gray-100 px-1 rounded text-xs">wfk_…</code> mit deinem API-Key:
          </p>
          <pre className="text-xs bg-gray-50 border border-gray-200 rounded p-3 overflow-x-auto text-gray-700">
{`<script
  src="${typeof window !== "undefined" ? window.location.origin : ""}/widget.js"
  data-api-key="wfk_..."
  data-api="${typeof window !== "undefined" ? window.location.origin : ""}"
></script>`}
          </pre>
        </section>
      </main>
    </div>
  );
}
