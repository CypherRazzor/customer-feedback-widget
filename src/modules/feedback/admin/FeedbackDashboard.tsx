import { pool } from "@/lib/db";
import { FeedbackList, type FeedbackItem } from "./FeedbackList";

async function loadFeedback(): Promise<FeedbackItem[]> {
  const { rows } = await pool.query<FeedbackItem>(
    `SELECT
       id, project_slug, page_url, css_selector, comment,
       screenshot_url, status, metadata,
       created_at::text AS created_at
     FROM feedback_annotations
     ORDER BY created_at DESC`
  );
  return rows;
}

export async function FeedbackDashboard() {
  const items = await loadFeedback();
  return <FeedbackList items={items} />;
}
