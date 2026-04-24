-- Multi-tenant API key isolation (DIG-944)
-- API keys are hashed (SHA-256) before storage; the raw key is returned once at creation time.
CREATE TABLE api_keys (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  key_hash     TEXT        UNIQUE NOT NULL,        -- SHA-256 of the raw key
  key_prefix   TEXT        NOT NULL,               -- first 12 chars, shown in UI
  project_slug TEXT        NOT NULL,               -- tenant identifier (links to feedback_annotations.project_slug)
  project_name TEXT        NOT NULL,               -- human-readable label
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at   TIMESTAMPTZ
);

CREATE INDEX idx_api_keys_hash ON api_keys(key_hash);
CREATE INDEX idx_api_keys_slug ON api_keys(project_slug);
