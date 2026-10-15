import { Router } from 'express'
import { registerSlice } from '../shared/slices.js'

/**
 * The /api/v1 mount point — the ONE place a feature slice becomes reachable.
 *
 * To add a feature:
 *   1. copy `src/modules/_template/` to `src/modules/<feature>/` and rename the files
 *   2. add its tables to prisma/schema.prisma and run `npm run db:migrate -- --name <feature>`
 *   3. mount the router below with `mount()`, and import its `.docs.ts` in `registerAllDocs()`
 *
 * Nothing else in the codebase changes. That is the point of the vertical-slice layout.
 */
export const apiRouter: Router = Router()

/**
 * Mount a slice and record it, so the /health dashboard lists what is genuinely wired up
 * instead of a hand-maintained list that drifts.
 */
function mount(name: string, path: string, router: Router): void {
  registerSlice({ name, path })
  apiRouter.use(path, router)
}

// ─── feature slices ──────────────────────────────────────────────────────────
// import { authRouter } from './auth/auth.routes.js'
// import { userRouter } from './user/user.routes.js'
//
// mount('Authentication', '/auth', authRouter)
// mount('Users', '/users', userRouter)
// ─────────────────────────────────────────────────────────────────────────────

void mount // remove this line once the first slice is mounted

/**
 * Side-effect imports that populate the OpenAPI registry. Each slice's `<feature>.docs.ts`
 * registers its paths; they must all run before `buildOpenApiDocument()` is called.
 */
export function registerAllDocs(): void {
  // await import('./auth/auth.docs.js')
  // await import('./user/user.docs.js')
}
