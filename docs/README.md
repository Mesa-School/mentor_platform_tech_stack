# Docs

| Doc | What it covers |
| --- | --- |
| [01-product.md](01-product.md) | Problem, users and roles, the five product areas, v1 scope and non-goals |
| [02-architecture.md](02-architecture.md) | System diagram, how each area maps onto the frontend and backend boilerplate, background jobs, integrations, deployment |
| [03-data-model.md](03-data-model.md) | Postgres schema for mentors, the CRM pipeline, onboarding, availability, bookings and sessions, with the Prisma models |
| [04-api.md](04-api.md) | REST endpoints per backend module, following the boilerplate's response and pagination conventions |
| [05-booking.md](05-booking.md) | Calendar booking in depth: availability, slot generation, double-booking prevention, Google Calendar sync, reminders, time zones |
| [06-onboarding-and-crm.md](06-onboarding-and-crm.md) | Mentor pipeline stages, onboarding steps, the CRM board, activity timeline and session notes |
| [07-founders-os-reuse.md](07-founders-os-reuse.md) | What to reuse from Founders OS, and the mistakes in it to avoid |
| [08-roadmap.md](08-roadmap.md) | Build order in phases, each with an exit check |
| [09-getting-started.md](09-getting-started.md) | Running both boilerplates locally and adding the first module |
| [10-security.md](10-security.md) | Auth, roles and row-level access, secrets, personal data, calendar tokens |

Open product decisions are marked **Decision needed** throughout. They are also
collected at the end of [01-product.md](01-product.md).
