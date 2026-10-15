/**
 * Id helpers — read this before writing an ownership check.
 *
 * ⚠️  AN ObjectId IS NEVER === A STRING.
 *
 *     doc.ownerId === session.user.id   // ALWAYS false, even when they match
 *
 * That comparison is the most dangerous line you can write in this stack,
 * because it looks correct and fails silently in one of two directions:
 *
 *   if (doc.ownerId !== userId) deny   →  denies EVERYONE, including the owner.
 *                                         Looks like a permissions bug, and the
 *                                         tempting "fix" is removing the check.
 *
 *   if (doc.ownerId === userId) allow  →  allows NOBODY, or if inverted
 *                                         somewhere, allows everyone.
 *
 * Convert both sides with these helpers, every time.
 */
import { ObjectId } from "mongodb";

export function toObjectId(value: string | ObjectId): ObjectId {
  return typeof value === "string" ? new ObjectId(value) : value;
}

export function toIdString(value: string | ObjectId): string {
  return typeof value === "string" ? value : value.toHexString();
}

/** True when two ids refer to the same document, whatever type they arrived as. */
export function sameId(
  a: string | ObjectId | null | undefined,
  b: string | ObjectId | null | undefined,
): boolean {
  if (!a || !b) return false;
  return toIdString(a) === toIdString(b);
}

/** Narrow untrusted input before it reaches a query. */
export function isValidObjectId(value: unknown): value is string {
  return typeof value === "string" && ObjectId.isValid(value);
}
