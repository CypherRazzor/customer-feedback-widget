import { createHash, randomBytes } from "crypto";
import { pool } from "./db";

export function generateApiKey(): string {
  return "wfk_" + randomBytes(24).toString("base64url");
}

export function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

export interface ApiKeyInfo {
  project_slug: string;
  project_name: string;
}

export async function verifyApiKey(key: string): Promise<ApiKeyInfo | null> {
  const hash = hashApiKey(key);
  const { rows } = await pool.query<ApiKeyInfo>(
    `SELECT project_slug, project_name
     FROM api_keys
     WHERE key_hash = $1 AND revoked_at IS NULL`,
    [hash]
  );
  return rows[0] ?? null;
}
