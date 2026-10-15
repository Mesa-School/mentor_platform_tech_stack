# Mentor Platform

A mentor management platform for Mesa School: one place to recruit and onboard
mentors, manage them like a CRM, let founders and students book sessions on their
calendars, and capture what happened in each session.

This repository is the **starting point**: the AI CTO boilerplate for the frontend
and backend, plus the product and technical docs that say what to build on it.
No product features are built yet.

```
.
├── docs/                     product and technical docs (start with docs/README.md)
└── tech-stack/
    ├── frontend/             Next.js 16 boilerplate (App Router, TanStack Query, shadcn/ui, Tailwind v4)
    ├── backend/              Express 5 + TypeScript boilerplate (Postgres, Prisma migrations, Kysely queries)
    └── BOILERPLATE_README.md how the AI CTO boilerplate is meant to be used
```

## Read in this order

1. [docs/01-product.md](docs/01-product.md): what we're building and for whom
2. [docs/02-architecture.md](docs/02-architecture.md): how it fits together on this stack
3. [docs/03-data-model.md](docs/03-data-model.md): the database schema
4. [docs/08-roadmap.md](docs/08-roadmap.md): build order
5. [docs/09-getting-started.md](docs/09-getting-started.md): run both apps locally

The full index is in [docs/README.md](docs/README.md).

## Where the code came from

- `tech-stack/frontend` and `tech-stack/backend` are copied unchanged from
  `AI CTO/ai_cto_npx/boilerplate`. Each has its own `README.md`, `AGENTS.md` and
  `docs/`, which define the conventions every new module must follow.
- Founders OS (Founders Compass) was analysed, not copied. What's worth reusing
  from it is in [docs/07-founders-os-reuse.md](docs/07-founders-os-reuse.md).
