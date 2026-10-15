# `docs/` — backend documentation

Project documentation lives here. `README.md` at the root stays short and points
into this folder.

## What is here

| File | What it covers |
| --- | --- |
| [`ARCHITECTURE.md`](ARCHITECTURE.md) | The vertical-slice layout, the request pipeline, and why Prisma and Kysely both exist |
| [`DATABASE.md`](DATABASE.md) | Migrations, queries, ownership, indexes, backups |
| [`ENVIRONMENT.md`](ENVIRONMENT.md) | Every variable, and what fails to boot without it |
| [`CONVENTIONS.md`](CONVENTIONS.md) | The rules an agent must follow when adding code |
| [`DEPLOY.md`](DEPLOY.md) | The deployment runbook — read before your first deploy |

Two more live next to the code they describe:

- [`../src/modules/README.md`](../src/modules/README.md) — how modules are organised
- [`../src/modules/_template/README.md`](../src/modules/_template/README.md) — the slice to copy

## Where the build instructions are

**Not here.** This documents *this codebase*. The step-by-step guides for
building features on it — with a copy-paste prompt, verification commands and a
security gate per module — live in the kit:

```
ai_cto/tiers/<tier>/stacks/<stack>/modules/
```

## Adding a doc

Keep it here, link it above, and write it for someone who has not seen the
codebase. If it explains a decision, say what the alternative was and why it
lost — that is the part nobody can reconstruct later.
