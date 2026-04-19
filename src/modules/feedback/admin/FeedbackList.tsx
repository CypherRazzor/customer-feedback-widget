"use client";

import { useState, useRef, useEffect } from "react";

export interface FeedbackItem {
  id: string;
  project_slug: string;
  page_url: string;
  css_selector: string | null;
  comment: string;
  screenshot_url: string | null;
  status: string;
  metadata: Record<string, string> | null;
  created_at: string;
}

// ── Assignee list (MVP: hardcoded, env-configurable later) ────────────────────
const ASSIGNEES = ["— niemand —", "Dev A", "Dev B", "Dev C"];

// ── Status helpers ─────────────────────────────────────────────────────────────
const STATUS_LABELS: Record<string, string> = {
  open: "Offen",
  in_progress: "In Bearbeitung",
  resolved: "Erledigt",
};

const STATUS_CLASSES: Record<string, string> = {
  open: "bg-yellow-100 text-yellow-800",
  in_progress: "bg-blue-100 text-blue-800",
  resolved: "bg-green-100 text-green-800",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${STATUS_CLASSES[status] ?? "bg-gray-100 text-gray-800"}`}
      aria-label={`Status: ${STATUS_LABELS[status] ?? status}`}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

// ── Screenshot Lightbox ────────────────────────────────────────────────────────
function Lightbox({ src, onClose }: { src: string; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    dialog.showModal();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <dialog
      ref={dialogRef}
      className="fixed inset-0 m-auto bg-transparent max-w-none max-h-none p-0 border-none"
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
    >
      <div className="relative flex items-center justify-center min-h-screen p-4 bg-black/70">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white bg-black/50 rounded-full w-8 h-8 flex items-center justify-center text-xl hover:bg-black/70 focus:ring-2 focus:ring-white"
          aria-label="Schließen"
        >
          ×
        </button>
        <img
          src={src}
          alt="Screenshot Vollbild"
          className="max-w-[90vw] max-h-[90vh] rounded shadow-lg"
        />
      </div>
    </dialog>
  );
}

// ── Element Reference Block ────────────────────────────────────────────────────
function ElementRef({
  selector,
  pageUrl,
}: {
  selector: string | null;
  pageUrl: string;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    if (!selector) return;
    await navigator.clipboard.writeText(selector);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="bg-gray-50 border border-gray-200 rounded p-2 text-xs font-mono text-gray-500 mt-2">
      {selector && (
        <div className="flex items-center gap-1 mb-0.5">
          <span className="text-gray-400 font-sans not-italic">Selector:</span>
          <span className="truncate flex-1">{selector}</span>
          <button
            onClick={copy}
            title="Kopieren"
            className="shrink-0 text-gray-400 hover:text-gray-700 focus:ring-2 focus:ring-blue-500 rounded"
            aria-label="Selector kopieren"
          >
            {copied ? "✓" : "⎘"}
          </button>
        </div>
      )}
      <div className="flex items-center gap-1">
        <span className="text-gray-400 font-sans not-italic">URL:</span>
        <span className="truncate flex-1">{pageUrl}</span>
      </div>
    </div>
  );
}

// ── Feedback Card ─────────────────────────────────────────────────────────────
function FeedbackCard({ item }: { item: FeedbackItem }) {
  const [status, setStatus] = useState(item.status);
  const [assignee, setAssignee] = useState(
    item.metadata?.assignee ?? "— niemand —"
  );
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const patch = async (body: Record<string, string>) => {
    await fetch(`/api/feedback/${item.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${document.cookie.match(/admin_session=([^;]+)/)?.[1] ?? ""}`,
      },
      body: JSON.stringify(body),
    });
  };

  const handleStatusChange = async (newStatus: string) => {
    setStatus(newStatus);
    await patch({ status: newStatus });
  };

  const handleAssigneeChange = async (newAssignee: string) => {
    setAssignee(newAssignee);
    await patch({ assignee: newAssignee === "— niemand —" ? "" : newAssignee });
  };

  const createdAt = new Date(item.created_at).toLocaleString("de-DE");

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      {/* Header row */}
      <div className="flex items-start justify-between gap-4 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <StatusBadge status={status} />
          <span className="text-xs text-gray-400">{createdAt}</span>
        </div>
      </div>

      {/* Comment */}
      <p className="text-sm text-gray-800 mb-2">{item.comment}</p>

      {/* Element reference */}
      <ElementRef selector={item.css_selector} pageUrl={item.page_url} />

      {/* Screenshot thumbnail */}
      {item.screenshot_url && (
        <div className="mt-3 group relative inline-block">
          <img
            src={item.screenshot_url}
            alt={`Screenshot vom ${createdAt} für ${item.project_slug}`}
            className="max-h-28 w-auto rounded border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => setLightboxOpen(true)}
          />
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <span className="bg-black/50 text-white text-xs rounded px-2 py-0.5">
              Vollbild
            </span>
          </div>
        </div>
      )}

      {lightboxOpen && item.screenshot_url && (
        <Lightbox
          src={item.screenshot_url}
          onClose={() => setLightboxOpen(false)}
        />
      )}

      {/* Card footer */}
      <div className="flex flex-wrap items-center gap-4 mt-3 pt-3 border-t border-gray-100">
        {/* Status dropdown */}
        <div className="flex items-center gap-1.5">
          <label className="text-xs text-gray-500">Status:</label>
          <select
            value={status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="text-xs border border-gray-300 rounded-md px-2 py-1 text-gray-700 focus:ring-2 focus:ring-blue-500"
          >
            <option value="open">Offen</option>
            <option value="in_progress">In Bearbeitung</option>
            <option value="resolved">Erledigt</option>
          </select>
        </div>

        {/* Assignee dropdown */}
        <div className="flex items-center gap-1.5">
          <label className="text-xs text-gray-500">Zugewiesen:</label>
          <select
            value={assignee}
            onChange={(e) => handleAssigneeChange(e.target.value)}
            className="text-xs border border-gray-300 rounded-md px-2 py-1 text-gray-700 focus:ring-2 focus:ring-blue-500 border-b border-dotted border-gray-300"
          >
            {ASSIGNEES.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

// ── Stat Strip ────────────────────────────────────────────────────────────────
function StatStrip({ items }: { items: FeedbackItem[] }) {
  const open = items.filter((i) => i.status === "open").length;
  const inProgress = items.filter((i) => i.status === "in_progress").length;
  const resolved = items.filter((i) => i.status === "resolved").length;

  return (
    <div className="bg-white border-b border-gray-100 px-6 py-3 flex gap-8">
      <div className="flex flex-col items-center">
        <span className="text-2xl font-bold text-yellow-600">{open}</span>
        <span className="text-xs text-gray-500 uppercase tracking-wide">Offen</span>
      </div>
      <div className="flex flex-col items-center">
        <span className="text-2xl font-bold text-blue-600">{inProgress}</span>
        <span className="text-xs text-gray-500 uppercase tracking-wide">
          In Bearbeitung
        </span>
      </div>
      <div className="flex flex-col items-center">
        <span className="text-2xl font-bold text-green-600">{resolved}</span>
        <span className="text-xs text-gray-500 uppercase tracking-wide">Erledigt</span>
      </div>
    </div>
  );
}

// ── Filter Bar ────────────────────────────────────────────────────────────────
function FilterBar({
  projects,
  filterProject,
  filterStatus,
  sortOrder,
  onProject,
  onStatus,
  onSort,
  onReset,
  hasActiveFilter,
}: {
  projects: string[];
  filterProject: string;
  filterStatus: string;
  sortOrder: string;
  onProject: (v: string) => void;
  onStatus: (v: string) => void;
  onSort: (v: string) => void;
  onReset: () => void;
  hasActiveFilter: boolean;
}) {
  const selectClass =
    "border border-gray-300 rounded-md px-3 py-1.5 text-sm text-gray-700 focus:ring-2 focus:ring-blue-500";

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-3 flex flex-wrap gap-3 items-center">
      <div className="flex items-center gap-1.5">
        <label className="text-sm font-medium text-gray-700">Projekt:</label>
        <select
          value={filterProject}
          onChange={(e) => onProject(e.target.value)}
          className={selectClass}
        >
          <option value="">Alle</option>
          {projects.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-1.5">
        <label className="text-sm font-medium text-gray-700">Status:</label>
        <select
          value={filterStatus}
          onChange={(e) => onStatus(e.target.value)}
          className={selectClass}
        >
          <option value="">Alle</option>
          <option value="open">Offen</option>
          <option value="in_progress">In Bearbeitung</option>
          <option value="resolved">Erledigt</option>
        </select>
      </div>

      <div className="flex items-center gap-1.5">
        <label className="text-sm font-medium text-gray-700">Sortierung:</label>
        <select
          value={sortOrder}
          onChange={(e) => onSort(e.target.value)}
          className={selectClass}
        >
          <option value="desc">Neueste zuerst</option>
          <option value="asc">Älteste zuerst</option>
        </select>
      </div>

      {hasActiveFilter && (
        <button
          onClick={onReset}
          className="text-xs text-gray-400 hover:text-gray-600 focus:ring-2 focus:ring-blue-500 rounded"
        >
          Filter zurücksetzen ×
        </button>
      )}
    </div>
  );
}

// ── Main Client Component ─────────────────────────────────────────────────────
export function FeedbackList({ items }: { items: FeedbackItem[] }) {
  const [filterProject, setFilterProject] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const projects = Array.from(new Set(items.map((i) => i.project_slug))).sort();
  const hasActiveFilter = !!filterProject || !!filterStatus || sortOrder !== "desc";

  const reset = () => {
    setFilterProject("");
    setFilterStatus("");
    setSortOrder("desc");
  };

  let filtered = items;
  if (filterProject) filtered = filtered.filter((i) => i.project_slug === filterProject);
  if (filterStatus) filtered = filtered.filter((i) => i.status === filterStatus);

  const sorted = [...filtered].sort((a, b) => {
    const diff =
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    return sortOrder === "desc" ? -diff : diff;
  });

  // Group by project slug
  const groups = new Map<string, FeedbackItem[]>();
  for (const item of sorted) {
    const existing = groups.get(item.project_slug) ?? [];
    existing.push(item);
    groups.set(item.project_slug, existing);
  }

  return (
    <>
      <StatStrip items={items} />
      <FilterBar
        projects={projects}
        filterProject={filterProject}
        filterStatus={filterStatus}
        sortOrder={sortOrder}
        onProject={setFilterProject}
        onStatus={setFilterStatus}
        onSort={(v) => setSortOrder(v as "asc" | "desc")}
        onReset={reset}
        hasActiveFilter={hasActiveFilter}
      />

      <main className="max-w-5xl mx-auto px-6 py-8">
        {sorted.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3 opacity-40">📭</div>
            <p className="text-gray-400 font-medium">
              Noch kein Feedback vorhanden.
            </p>
            <p className="text-sm text-gray-400 mt-1">
              Feedbacks erscheinen hier, sobald Nutzer sie über das Widget einreichen.
            </p>
          </div>
        ) : (
          <div className="space-y-10">
            {Array.from(groups.entries()).map(([slug, groupItems]) => {
              const open = groupItems.filter((i) => i.status === "open").length;
              const inProg = groupItems.filter(
                (i) => i.status === "in_progress"
              ).length;
              const done = groupItems.filter(
                (i) => i.status === "resolved"
              ).length;
              return (
                <section key={slug}>
                  <h2 className="text-base font-semibold text-gray-700 border-b pb-2 mb-3">
                    {slug}
                    <span className="ml-2 text-sm font-normal text-gray-400">
                      ({open > 0 && `${open} offen`}
                      {open > 0 && (inProg > 0 || done > 0) && " · "}
                      {inProg > 0 && `${inProg} in Bearbeitung`}
                      {inProg > 0 && done > 0 && " · "}
                      {done > 0 && `${done} erledigt`})
                    </span>
                  </h2>
                  <div className="space-y-4">
                    {groupItems.map((item) => (
                      <FeedbackCard key={item.id} item={item} />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}
