# 10 · Security and privacy

## Authentication

- **Access token:** a JWT (jose, HS256) valid for 15 minutes, held in memory
  by the frontend and sent as a Bearer header.
- **Refresh token:** valid for 7 days, in an httpOnly, `Secure`,
  `SameSite=Strict` cookie scoped to `/api/v1/auth`. It **rotates on every
  refresh**. Reusing an old refresh token revokes the whole token family (stolen
  token detection). Stored as a hash in `RefreshSession`.
- **Passwords:** argon2id (boilerplate `password.ts`).
- **Invites and password resets:** random 32-byte tokens, stored hashed,
  single use, with an expiry (invites 7 days, resets 30 minutes).
- **Rate limits:** on login, reset and booking (see [04-api.md](04-api.md#rate-limits)).

## Authorisation

- **Roles:** `ADMIN`, `MANAGER`, `MENTOR`, `MENTEE`. Route guards come from the
  boilerplate: `requireAuth`, `requireRole`, `requireSelfOrRole`.
- **Rows are filtered in SQL** (`scopeFor`), not after fetching. A programme
  manager's queries always include their programme ids.
- **Field-level visibility:** mentees never receive internal CRM fields (owner,
  source, private notes, stage history). Use separate response schemas per role;
  don't strip fields in the frontend.
- **Booking access:** only the two participants, programme managers of that
  programme, and admins.
- **Hiding a button is not security.** The `(app)/admin` route group is a
  layout; every API endpoint checks the role itself.

## Secrets

- **Nothing secret in git.** Use `.env.example` with placeholders only; real values
  live in Secret Manager. Cloud Build already reads secrets this way.
- **No service-account key files.** Use workload identity on GCP. (Founders OS
  committed two key files; don't repeat that, and rotate those keys.)
- **`NEXT_PUBLIC_*` is visible to every browser:** only public identifiers go there.

## Google Calendar tokens

- **Mentor refresh tokens** are encrypted at rest (AES-256-GCM) with a key from
  Secret Manager, never logged, and deleted (plus revoked at Google) on disconnect.
- **The OAuth `state` parameter** is signed and bound to the user, to stop
  connect-flow forgery.
- **Webhook requests** are verified by channel id and channel token before any work.
- **Minimum scopes only** (see [05-booking.md](05-booking.md#google-oauth-scopes)).

## Personal data

India's Digital Personal Data Protection Act 2023 applies (names, emails, phone
numbers, photos, session notes).

- **Collect only what the product uses**, and say why in the onboarding flow.
- **Session notes are sensitive:** private notes are visible to the mentor and
  the programme team only, and notes are shared with the mentee only when the
  mentor allows.
- **Export and delete:** an admin can export or delete a person's data on request;
  deletion removes the profile, photo, calendar connection and notes, and keeps
  anonymised booking counts for reports.
- **AI drafts:** send only the text the mentor pastes, with no other records, and
  use a provider and region the organisation has approved.
- **Audit log:** stage changes, approvals, role changes, cancellations and data
  exports all write to `AuditLog`.
