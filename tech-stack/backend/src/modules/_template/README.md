# _template

Copy this folder to `src/modules/<feature>/`, rename every `_template.*` file to `<feature>.*`,
uncomment the blueprint inside each, and replace `Thing` with your resource.

The files here are intentionally inert (the code is commented out) so an unbuilt template can
never compile into the running app or show up in the OpenAPI spec.

Checklist for a new slice:

- [ ] tables added to `prisma/schema.prisma`, `npm run db:migrate -- --name <feature>`
- [ ] one index per access pattern; business uniqueness enforced by a DB constraint
- [ ] Zod schemas for body / params / query
- [ ] repository: `SELECT` only the columns you return, joins in a single statement, scope in the `WHERE`
- [ ] service: rules, transaction around multi-writes, audit entry inside that transaction
- [ ] controller: parse → call service → `ok`/`created`/`paginated`
- [ ] `registerPath` in `<feature>.docs.ts`
- [ ] router registered in `src/modules/router.ts`, docs import added to `registerAllDocs()`
- [ ] tests: happy path, validation 422, uniqueness 409, wrong role 403, out-of-scope 404
