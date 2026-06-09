import { pool } from "@/lib/db";
import { ResolveButton } from "./ResolveButton";

interface FeedbackRow {
  id: string;
  project_slug: string;
  session_id: string;
  page_url: string;
  css_selector: string | null;
  comment: string;
  screenshot_url: string | null;
  confirmed_at: Date | null;
  resolved_at: Date | null;
  created_at: Date;
}

interface GroupedFeedback {
  slug: string;
  items: FeedbackRow[];
}

async function loadFeedback(projectSlug?: string): Promise<GroupedFeedback[]> {
  const params: string[] = [];
  const where = projectSlug
    ? `WHERE project_slug = $${params.push(projectSlug)}`
    : "";

  const { rows } = await pool.query<FeedbackRow>(
    `SELECT * FROM feedback_annotations ${where} ORDER BY project_slug, created_at DESC`,
    params
  );

  const groups = new Map<string, FeedbackRow[]>();
  for (const row of rows) {
    const existing = groups.get(row.project_slug) ?? [];
    existing.push(row);
    groups.set(row.project_slug, existing);
  }

  return Array.from(groups.entries()).map(([slug, items]) => ({ slug, items }));
}

function StatusBadge({ row }: { row: FeedbackRow }) {
  if (row.resolved_at) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
        Erledigt
      </span>
    );
  }
  if (row.confirmed_at) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
        Bestätigt
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
      Offen
    </span>
  );
}

export async function FeedbackDashboard({ projectSlug }: { projectSlug?: string } = {}) {
  const groups = await loadFeedback(projectSlug);

  if (groups.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        Noch kein Feedback vorhanden.
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {groups.map(({ slug, items }) => (
        <section key={slug}>
          <h2 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-2">
            {slug}
            <span className="ml-2 text-sm font-normal text-gray-400">
              ({items.length} Einträge)
            </span>
          </h2>
          <div className="space-y-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <StatusBadge row={item} />
                    <span className="text-xs text-gray-400">
                      {new Date(item.created_at).toLocaleString("de-DE")}
                    </span>
                  </div>
                  {!item.resolved_at && <ResolveButton id={item.id} />}
                </div>

                <p className="text-sm text-gray-800 mb-2">{item.comment}</p>

                {item.css_selector && (
                  <p className="text-xs font-mono text-gray-400 truncate mb-2">
                    {item.css_selector}
                  </p>
                )}

                <p className="text-xs text-gray-400 truncate">
                  {item.page_url}
                </p>

                {item.screenshot_url && (
                  <a
                    href={item.screenshot_url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-block"
                  >
                    <img
                      src={item.screenshot_url}
                      alt="Screenshot"
                      className="max-h-32 rounded border border-gray-200 hover:opacity-80 transition-opacity"
                    />
                  </a>
                )}
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
