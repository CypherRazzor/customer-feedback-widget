-- Canonical copy of the feedback_annotations migration.
-- Run this in your Hetzner KonsoleH PostgreSQL instance.
-- See also: migrations/20260407000000_feedback_annotations.sql

CREATE TABLE IF NOT EXISTS feedback_annotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_slug TEXT NOT NULL,
  session_id UUID NOT NULL DEFAULT gen_random_uuid(),
  page_url TEXT NOT NULL,
  css_selector TEXT,
  comment TEXT NOT NULL,
  screenshot_url TEXT,
  metadata JSONB,
  confirmed_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feedback_project ON feedback_annotations(project_slug);
CREATE INDEX IF NOT EXISTS idx_feedback_session ON feedback_annotations(session_id);
CREATE INDEX IF NOT EXISTS idx_feedback_resolved ON feedback_annotations(resolved_at) WHERE resolved_at IS NULL;
