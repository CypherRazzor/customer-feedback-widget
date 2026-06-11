import { Pool } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var _pgPool: Pool | undefined;
}

function getPool(): Pool {
  if (!globalThis._pgPool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) throw new Error("DATABASE_URL is not set");
    globalThis._pgPool = new Pool({ connectionString, max: 5 });
  }
  return globalThis._pgPool;
}

// Proxy that defers pool creation to first use — safe to import during Next.js build
export const pool = new Proxy({} as Pool, {
  get(_target, prop) {
    const live = getPool();
    const val = live[prop as keyof Pool];
    return typeof val === "function" ? (val as Function).bind(live) : val;
  },
});
