# modules — vertical slices

One folder per feature. A slice owns its **entire** stack: router, controller, service,
repository (the SQL), Zod schemas, OpenAPI registration, types, and tests. Adding a feature
means copying `_template/`, swapping the SQL and the rules, and registering the router in
`router.ts`. Nothing outside the slice moves.

```
<feature>/
├─ <feature>.routes.ts       express.Router() — paths → guards → controller. No logic.
├─ <feature>.controller.ts   HTTP only: parse with Zod, call the service, send the envelope.
├─ <feature>.service.ts      Business rules, transactions, audit writes, orchestration.
├─ <feature>.repository.ts   Kysely/SQL. The ONLY place SQL lives.
├─ <feature>.schema.ts       Zod schemas for body / params / query.
├─ <feature>.docs.ts         registry.registerPath(...) — generates the OpenAPI entry.
├─ <feature>.types.ts        DTOs and domain types for this slice.
└─ <feature>.test.ts         Integration tests through the full HTTP stack.
```

## Layer contract

| Layer | Knows about | Must NOT |
|---|---|---|
| routes | URL paths, which guards apply, which controller method | contain logic |
| controller | `req`/`res`, Zod parsing, the response envelope | contain business rules or SQL |
| service | business rules, transactions, audit, calling repositories | touch `req`/`res` or write SQL |
| repository | Kysely, the `DB` types, mapping rows ↔ domain types | contain business rules or HTTP concerns |

**Dependency direction is one-way.** `modules/` imports from `core/` and `shared/`.
`core/` and `shared/` never import from `modules/` (enforced by ESLint) — the single exception
is `core/http/app.ts`, which is the composition root and mounts `modules/router.ts`.

A slice never reaches into another slice's internals. If two features need the same logic, it
moves to `core/` or `shared/`.

## Why a controller *and* a service

The controller adapts HTTP to a plain function call; the service is that plain function. Keeping
them apart means the business rules are testable without Express, callable later from a queue
worker or CLI, and unaffected when the transport changes. When a service would be a pure
one-liner you may let the controller call the repository directly — but the moment there is a
rule, a transaction, or an audit write, it belongs in the service.
