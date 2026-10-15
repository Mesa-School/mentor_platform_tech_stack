/**
 * A tiny registry of the feature slices mounted under /api/v1, used by the operator dashboard
 * so it lists what is actually wired up rather than a hand-maintained list that goes stale.
 *
 * It lives in `shared/` rather than `modules/` on purpose: `core/` renders the dashboard, and
 * core must never import a feature slice. Both sides depend on this instead.
 */
export type SliceInfo = {
  /** Human label for the dashboard, e.g. 'Users'. */
  name: string
  /** Path under /api/v1, e.g. '/users'. */
  path: string
}

export const registeredSlices: SliceInfo[] = []

/** Called by modules/router.ts as each slice is mounted. */
export function registerSlice(slice: SliceInfo): SliceInfo {
  registeredSlices.push(slice)
  return slice
}
