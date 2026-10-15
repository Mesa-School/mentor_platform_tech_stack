# 07 · Reusing Founders OS

Founders OS (repository folder "Founders Compass") is Mesa's AI startup coach
for founders: Idea Lab, Problem Discovery and Launch Pad. It runs on **FastAPI +
MongoDB** with a **Next.js** frontend. The mentor platform uses a different
backend stack (Express + Postgres), so we reuse **designs and patterns**, not
files.

## What it has that's relevant

**No mentor features exist in it.** Mentors, calendar booking, availability,
Google Calendar, Meet links, CRM pipelines, payments and WhatsApp code are all
absent. "Ecosystem", where mentors were meant to live, is a "coming soon" stub.

| Founders OS piece | Where | How to reuse it |
| --- | --- | --- |
| **Session check-in design** | `exports/templates/Mesa_CheckIn_RAW_TEMPLATE.md`, `exports/mesa_brain_data_template.html` (Layer 3) | The structure of our session notes: outcome, problems, advice, action items with owner and due date, follow-up on earlier advice |
| **Onboarding wizard** | `frontend/src/components/onboarding/OnboardingWizard.tsx` | Multi-step pattern for mentor onboarding (step routes, progress, resume) |
| **Questionnaire with autosave** | `frontend/src/components/discovery/form/*`, `store/discoveryFormStore.tsx` | Chip selects, rating grids, section shell; draft autosave, then submit to a background job |
| **LinkedIn enrichment** | `backend/app/services/linkedin_scraper.py`, frontend `LinkedInGuard.tsx` | Same flow for mentor profiles: Apify run → poll → parse → re-host photo to GCS → status field the UI polls. Port to a TypeScript job |
| **Private files with signed URLs** | `backend/app/services/gcs_upload.py` | Private bucket and short-lived signed URLs generated on read. Implement as the boilerplate's GCS `Storage` adapter |
| **Admin console** | `backend/app/routes/admin_v2.py`, `frontend/src/app/admin/(shell)/*` | Layout and metrics ideas (funnels, KPIs, 30-day trends, health) for programme dashboards |
| **Ownership check** | `core/dependencies.py` (`require_self`, `require_admin`) | Already covered by the boilerplate's `requireSelfOrRole` and `scopeFor` |
| **Runtime config endpoint** | `frontend/src/app/api/config` | One image for every environment; consider it if the frontend runs in Docker |
| **Email templates** | `backend/templates/`, `services/email_service.py` | Layout reference only; we send through SES from a job |

## Mistakes to avoid

| In Founders OS | Do this instead |
| --- | --- |
| **Two Google service-account key files committed** in `backend/` and copied into the Docker image (not in `.gitignore` or `.dockerignore`) | Never commit keys. Use Secret Manager and workload identity. **These keys should be rotated now.** |
| Access and refresh tokens in cookies readable by JavaScript | Access token in memory; refresh token in an httpOnly cookie (the boilerplate does this) |
| Refresh tokens not stored server-side, so they can't be revoked | `RefreshSession` table with rotation and reuse detection |
| The `isAdmin` claim is lost after Google login or refresh, which logs admins out of the UI | Derive roles on the server on every refresh |
| OTPs and reset tokens stored in plain text | Store a hash; single use; short expiry |
| Background work via `asyncio.create_task` (lost on restart) | pg-boss jobs with retries |
| MongoDB with two drivers, no schema, no migrations | Postgres + Prisma migrations + Kysely types |
| Many unused dependencies on both sides | Add dependencies only when a module needs them |
| Hand-rolled forms with no validation, except on login | react-hook-form + Zod everywhere (boilerplate default) |
| The docker-compose health check hits an endpoint that needs auth, so it always fails | Use the boilerplate's `/healthz` and `/readyz` |
| One-off data-fix scripts in the repo (`fix_linkedin_aryan.py`...) | Migrations or audited admin actions |
