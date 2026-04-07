/**
 * CLI script to generate a preview token for a customer.
 *
 * Usage:
 *   npx tsx scripts/generate-preview-token.ts <project-slug> [session-id]
 *
 * Requires PREVIEW_TOKEN_SECRET in environment (or .env file).
 *
 * Example:
 *   PREVIEW_TOKEN_SECRET=... npx tsx scripts/generate-preview-token.ts acme-gmbh
 */

import { randomUUID } from "crypto";
import { createPreviewToken } from "../src/lib/preview-token";

const slug = process.argv[2];
if (!slug) {
  console.error("Usage: generate-preview-token.ts <project-slug> [session-id]");
  process.exit(1);
}

const sessionId = process.argv[3] ?? randomUUID();
const token = createPreviewToken(slug, sessionId);
const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

console.log("\n=== Preview Token ===");
console.log(`Slug:      ${slug}`);
console.log(`SessionID: ${sessionId}`);
console.log(`Token:     ${token}`);
console.log(`\nPreview URL:`);
console.log(`  ${appUrl}/preview?token=${token}`);
console.log("");
