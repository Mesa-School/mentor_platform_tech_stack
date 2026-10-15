# 04 · API

All endpoints live under `/api/v1` and follow the backend boilerplate's conventions:

- **Success:** `{ "data": ..., "meta": ... }`. Lists use cursor pagination:
  `?limit=20&cursor=...`, with `meta: { nextCursor, hasMore }` (max 100 per page).
- **Errors:** `{ "error": { "code", "message", "details?" } }`, with status codes
  401, 403, 404, 409, 422, 429 and 502 from the boilerplate's `AppError` classes.
- **Mutations return the full resource**, so the frontend can update its
  TanStack Query cache without a refetch.
- **Validation:** a Zod schema per endpoint in `<module>.schema.ts`, which also
  generates the OpenAPI docs at `/docs` and `/redoc`.
- **Auth:** `Authorization: Bearer <access token>`. The refresh token is an httpOnly
  cookie on `/api/v1/auth`.

Role column: **A** admin, **M** programme manager (own programmes), **Me** mentor
(self), **Mt** mentee (self), **Pub** no login.

## auth

| Method | Path | Who | Notes |
| --- | --- | --- | --- |
| POST | `/auth/login` | Pub | Email and password; returns an access token, sets the refresh cookie |
| POST | `/auth/refresh` | Pub (cookie) | Rotates the refresh token; reuse of an old one revokes the whole family |
| POST | `/auth/logout` | Any | Revokes the session |
| POST | `/auth/invites/:token/accept` | Pub | Set a password from an invite link |
| POST | `/auth/password/forgot` · `/auth/password/reset` | Pub | Hashed, single-use, 30-minute tokens |
| GET | `/auth/me` | Any | Current user, role, programmes |

## mentors

| Method | Path | Who | Notes |
| --- | --- | --- | --- |
| GET | `/mentors` | A, M, Mt | Directory. Filters: `q`, `stage`, `tags`, `city`, `programmeId`, `availableWithinDays`. Mentees only see `ACTIVE` mentors |
| POST | `/mentors` | A, M | Create a prospect |
| POST | `/mentors/import` | A | CSV upload; returns `202` and a job id; rows that fail validation are reported |
| GET | `/mentors/:id` | A, M, Me (self), Mt (public fields) | Field-level visibility: mentees never see internal notes, owner or source |
| PATCH | `/mentors/:id` | A, M, Me (own profile fields) | Optimistic locking via `version` |
| GET | `/mentors/by-slug/:slug` | Mt | Public profile for booking links |

## pipeline

| Method | Path | Who | Notes |
| --- | --- | --- | --- |
| GET | `/pipeline/board` | A, M | Mentors grouped by stage, with counts |
| POST | `/mentors/:id/stage` | A, M | `{ toStage, reason? }`; writes a `PipelineEvent` and an audit entry |
| GET | `/mentors/:id/activities` | A, M | Timeline, newest first |
| POST | `/mentors/:id/activities` | A, M | Add a note, call or meeting |

## onboarding

| Method | Path | Who | Notes |
| --- | --- | --- | --- |
| POST | `/mentors/:id/invite` | A, M | Creates a user and an invite token; emails the link; moves stage to `ONBOARDING` |
| GET | `/onboarding/me` | Me | Steps and progress |
| PUT | `/onboarding/me/draft` | Me | Autosave form answers |
| POST | `/onboarding/me/steps/:step` | Me | Complete `profile`, `linkedin`, `agreement` or `calendar` |
| POST | `/onboarding/me/submit` | Me | Ready for review |
| POST | `/mentors/:id/onboarding/approve` | A, M | Stage becomes `ACTIVE`; the mentor is visible to mentees |

## availability and calendar

| Method | Path | Who | Notes |
| --- | --- | --- | --- |
| GET, PUT | `/mentors/me/availability` | Me | Weekly rules and exceptions, replaced as one set |
| GET, PUT | `/mentors/me/booking-settings` | Me | Durations, buffers, notice, limits, approval |
| GET | `/mentors/:id/slots?from=&to=&duration=&tz=` | Mt, A, M | Free slots, computed server-side (see [05-booking.md](05-booking.md)) |
| GET | `/calendar/google/connect` | Me | Redirects to Google consent with a signed `state` |
| GET | `/calendar/google/callback` | Pub (state-checked) | Stores the encrypted refresh token, starts a watch |
| DELETE | `/calendar/google` | Me | Revokes the token and stops the watch |
| POST | `/calendar/google/webhook` | Google | Verifies channel id and token; enqueues `calendar.pull-changes`; responds 200 right away |

## bookings

| Method | Path | Who | Notes |
| --- | --- | --- | --- |
| POST | `/bookings` | Mt | `{ mentorId, startsAt, duration, agenda }`; re-checks the slot in a transaction; `409 SLOT_TAKEN` on a race |
| GET | `/bookings` | All (scoped) | Filters: `status`, `from`, `to`, `mentorId`, `menteeId` |
| GET | `/bookings/:id` | Participants, A, M | |
| POST | `/bookings/:id/accept` · `/decline` | Me | For mentors who require approval |
| POST | `/bookings/:id/reschedule` | Participants | Creates a new booking linked by `rescheduledFrom`; cancels the old one |
| POST | `/bookings/:id/cancel` | Participants, A | Before the cut-off; admins can always cancel |
| POST | `/bookings/:id/no-show` | Me | After the start time only |

## sessions

| Method | Path | Who | Notes |
| --- | --- | --- | --- |
| GET, PUT | `/bookings/:id/note` | Me (write), Mt (read if shared), A, M | Outcome, problems, advice, private notes |
| POST | `/bookings/:id/note/draft` | Me | `{ transcript }`; returns `202`; the draft arrives in the note with `aiDrafted: true` |
| POST | `/bookings/:id/action-items` | Me | |
| PATCH | `/action-items/:id` | Owner, Me | Mark done |
| GET | `/action-items?mine=true` | Mt | Open action items across sessions |
| POST | `/bookings/:id/feedback` | Participants | One per person per booking |

## programmes, users and reports

| Method | Path | Who | Notes |
| --- | --- | --- | --- |
| CRUD | `/programmes`, `/programmes/:id/members` | A (all), M (own, members only) | |
| CRUD | `/users` | A | |
| GET | `/reports/programmes/:id` | A, M | Sessions booked, held, no-shows, average rating, onboarding funnel |
| GET | `/reports/mentors/:id` | A, M | |
| GET | `/reports/export.csv?type=` | A, M | Streamed CSV |

## Rate limits

The boilerplate's default limiter applies to everything. Tighter limits:

- Login and password reset: 5 per minute per IP and per email.
- Booking create: 10 per minute per user.
- Slot lookups: 60 per minute per user.
