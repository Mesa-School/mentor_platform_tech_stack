/**
 * Cached MongoDB connection.
 *
 * ⚠️  WHY THE CACHE EXISTS
 * Serverless invocations do not share memory, and Next dev reloads modules on
 * every change. Without this cache you open a NEW connection per invocation and
 * exhaust the Atlas connection limit under mild load.
 *
 * The symptom is intermittent timeouts that look exactly like a network fault,
 * so people spend a day blaming their host. Watch Atlas → Metrics → Connections:
 * a line that climbs with traffic means this cache is not working.
 *
 * SERVER ONLY. `MONGODB_URI` contains your database password — there is no
 * version of this file that belongs in the browser.
 */
import "server-only";

import { MongoClient, type Db } from "mongodb";

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

function uri(): string {
  const value = process.env.MONGODB_URI;
  if (!value) {
    throw new Error(
      "MONGODB_URI is not set. Copy .env.example to .env.local and fill it in.",
    );
  }
  return value;
}

function getClientPromise(): Promise<MongoClient> {
  // Reuse across hot reloads in dev and across invocations in production.
  const existing = global._mongoClientPromise;
  if (existing) return existing;

  const created = new MongoClient(uri(), {
    maxPoolSize: Number(process.env.MONGODB_POOL_MAX ?? 10),
    serverSelectionTimeoutMS: 5_000,
  }).connect();

  global._mongoClientPromise = created;
  return created;
}

export async function getDb(): Promise<Db> {
  const client = await getClientPromise();
  return client.db(process.env.MONGODB_DB);
}

/** Used by /api/health. Cheap, and it actually round-trips to the server. */
export async function pingDb(): Promise<boolean> {
  try {
    const db = await getDb();
    await db.command({ ping: 1 });
    return true;
  } catch {
    return false;
  }
}
