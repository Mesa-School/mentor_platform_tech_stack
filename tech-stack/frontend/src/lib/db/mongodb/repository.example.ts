/**
 * THE REPOSITORY PATTERN — copy this shape for every collection.
 *
 * Rename to `posts.repository.ts` (or move it into a feature slice) and adapt.
 * It is `.example.ts` so it never compiles into your app by accident.
 *
 * ── Why every function takes `ownerId` ────────────────────────────────────
 * There is NO database-level authorization in MongoDB. No policies, no RLS,
 * nothing behind you. The `WHERE` clause you write is the only thing standing
 * between a signed-in user and everyone else's data.
 *
 * Putting every query in a file like this — with `ownerId` a REQUIRED parameter
 * on every read — turns "does every query filter by owner?" into a question you
 * can answer by reading a dozen files instead of a hundred.
 *
 * The check that proves it:
 *     grep -rn "\.find(\|\.findOne(\|\.updateOne(" src/ | grep -v repository
 *     → must return nothing
 */
import "server-only";

import type { Filter, ObjectId, WithId } from "mongodb";

import { getDb } from "./connect";
import { toObjectId } from "./ids";

const COLLECTION = "posts";

export interface Post {
  _id: ObjectId;
  ownerId: ObjectId;
  title: string;
  body: string;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

/** Run ONCE at setup. Every field you filter on needs an index. */
export async function ensureIndexes() {
  const db = await getDb();
  await db.collection<Post>(COLLECTION).createIndexes([
    // The ownership index. Without it every permission-filtered query is a full
    // collection scan — invisible at 50 documents, fatal at 50,000.
    { key: { ownerId: 1, createdAt: -1 }, name: "owner_created" },
    { key: { published: 1, createdAt: -1 }, name: "published_created" },
  ]);
}

/* ------------------------------------------------------------------------- */
/*  Reads — ownerId is REQUIRED, and it goes IN the filter                    */
/* ------------------------------------------------------------------------- */

export async function listByOwner(
  ownerId: string,
  { limit = 20, cursor }: { limit?: number; cursor?: string } = {},
): Promise<WithId<Post>[]> {
  const db = await getDb();

  const filter: Filter<Post> = {
    ownerId: toObjectId(ownerId),
    deletedAt: null,
  };
  if (cursor) filter._id = { $lt: toObjectId(cursor) };

  return db
    .collection<Post>(COLLECTION)
    .find(filter)
    // Always cap. A list query with no limit works until one customer has
    // four thousand rows.
    .limit(Math.min(limit, 100))
    .sort({ _id: -1 })
    .toArray();
}

/**
 * ✅ The owner is IN the query.
 *
 * ❌ What this deliberately is NOT:
 *
 *     const doc = await col.findById(id);
 *     if (!sameId(doc.ownerId, ownerId)) throw new ForbiddenError();
 *
 * That reads like a permission check and is not one. The document has already
 * been read, is in your query log, and is one careless error path away from
 * being serialised to the wrong person. `findById` cannot express ownership —
 * which is the entire reason it does not appear anywhere in this file.
 */
export async function getOwned(
  id: string,
  ownerId: string,
): Promise<WithId<Post> | null> {
  const db = await getDb();
  return db.collection<Post>(COLLECTION).findOne({
    _id: toObjectId(id),
    ownerId: toObjectId(ownerId),
    deletedAt: null,
  });
}

/* ------------------------------------------------------------------------- */
/*  Writes — fields are WHITELISTED, never spread from a request body         */
/* ------------------------------------------------------------------------- */

export async function create(
  ownerId: string,
  input: { title: string; body: string },
): Promise<WithId<Post>> {
  const db = await getDb();
  const now = new Date();

  const doc = {
    ownerId: toObjectId(ownerId),
    // Named explicitly. Never `...input` — a body containing `ownerId`,
    // `role` or `published` would otherwise be written straight through.
    title: input.title,
    body: input.body,
    published: false,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  } satisfies Omit<Post, "_id">;

  const result = await db.collection<Post>(COLLECTION).insertOne(doc as Post);
  return { ...doc, _id: result.insertedId } as WithId<Post>;
}

export async function updateOwned(
  id: string,
  ownerId: string,
  input: { title?: string; body?: string; published?: boolean },
): Promise<WithId<Post> | null> {
  const db = await getDb();

  // Whitelist. `$set: input` would let a user set any field in the schema.
  const $set: Partial<Post> = { updatedAt: new Date() };
  if (input.title !== undefined) $set.title = input.title;
  if (input.body !== undefined) $set.body = input.body;
  if (input.published !== undefined) $set.published = input.published;

  return db.collection<Post>(COLLECTION).findOneAndUpdate(
    // The owner is in the FILTER, so a non-owner matches nothing and the
    // update is a no-op rather than a leak.
    { _id: toObjectId(id), ownerId: toObjectId(ownerId), deletedAt: null },
    { $set },
    { returnDocument: "after" },
  );
}

/** Soft delete. Every read above filters `deletedAt: null`. */
export async function softDeleteOwned(
  id: string,
  ownerId: string,
): Promise<boolean> {
  const db = await getDb();
  const result = await db
    .collection<Post>(COLLECTION)
    .updateOne(
      { _id: toObjectId(id), ownerId: toObjectId(ownerId), deletedAt: null },
      { $set: { deletedAt: new Date(), updatedAt: new Date() } },
    );
  return result.modifiedCount === 1;
}
