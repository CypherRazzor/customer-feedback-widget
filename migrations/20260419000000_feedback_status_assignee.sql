-- Add status column and ensure metadata column exists
-- Status: 'open' | 'in_progress' | 'resolved'
-- Assignee is stored in metadata JSONB as metadata->>'assignee'

ALTER TABLE feedback_annotations
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'open';

-- Backfill status from existing resolved_at / confirmed_at
UPDATE feedback_annotations
  SET status = 'resolved' WHERE resolved_at IS NOT NULL;

UPDATE feedback_annotations
  SET status = 'in_progress' WHERE confirmed_at IS NOT NULL AND resolved_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback_annotations(status);
