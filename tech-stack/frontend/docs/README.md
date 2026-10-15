# `docs/` — frontend documentation

Project documentation lives here. `README.md` at the root stays short and points
into this folder.

## What is here

| File | What it covers |
| --- | --- |
| [`ARCHITECTURE.md`](ARCHITECTURE.md) | How the app is laid out and why — the data path, the folder rules, the server/client boundary |
| [`DATABASE.md`](DATABASE.md) | Talking to a database directly (Tier 1 only): Supabase vs MongoDB, and what changes between them |
| [`ENVIRONMENT.md`](ENVIRONMENT.md) | Every variable, what it does, and which are safe to publish |
| [`CONVENTIONS.md`](CONVENTIONS.md) | The rules an agent must follow when adding code here |

Two more live next to the code they describe, deliberately — you find them when
you are already in the right folder:

- [`../src/app/api/README.md`](../src/app/api/README.md) — when a Route Handler
  is justified, and the rules for adding one
- [`../src/lib/db/README.md`](../src/lib/db/README.md) — the database layer, and
  why most projects should delete it

## Where the build instructions are

**Not here.** This folder documents *this codebase*. The step-by-step guides for
building features on top of it — with a copy-paste prompt, verification commands
and a security gate per module — live in the kit:

```
ai_cto/tiers/<tier>/stacks/<stack>/modules/
```

Start with that kit's `INITIALIZE.md`, then work its modules in order.

## Adding a doc

Keep it in this folder, link it from the table above, and write it for someone
who has not seen the codebase. If it explains a decision, say what the
alternative was and why it lost — that is the part nobody can reconstruct later.
