# 08 · Roadmap

Each phase ends with an exit check that decides whether the next one starts.
Rough sizes assume two engineers.

## Phase 0 · Foundations (1 week)

- Rename both boilerplates (service name, app name, branding) and set up
  repos, CI and the staging environment.
- Write `PRODUCT.md` at the backend root (the backend `AGENTS.md` expects it),
  based on [01-product.md](01-product.md).
- Backend: **auth slice** (login, refresh with `RefreshSession`, logout, invites,
  password reset), `users`, roles extended to `MENTOR` and `MENTEE`, programme
  scoping in `scopeFor`.
- pg-boss set up and running; SES email job; GCS storage adapter.
- Frontend: login, accept-invite and reset screens wired to the real API; role
  workspaces (`admin`, `mentor`, `mentee`).

**Exit check:** an admin invites a test mentor, who sets a password and
lands in the mentor workspace; tokens rotate and logout revokes.

## Phase 1 · CRM (2 weeks)

- `mentors`, `pipeline` and `programmes` modules; CSV import of the current sheet.
- Directory table, pipeline board (`@dnd-kit`), mentor detail with timeline.

**Exit check:** the programme team stops using the spreadsheet; all existing
mentors are imported with the right stage and owner.

## Phase 2 · Onboarding (2 weeks)

- `onboarding` module and wizard (profile, LinkedIn, agreement, calendar placeholder).
- LinkedIn enrichment job; approval flow; stuck reminders.

**Exit check:** five real mentors complete onboarding without help.

## Phase 3 · Booking (3 weeks)

- `availability` (rules, exceptions, settings, slot engine with unit tests).
- `calendar` (Google OAuth, free/busy, events with Meet, watch channels,
  sync); **submit for Google app verification at the start of this phase**.
- `bookings` (book, approve, reschedule, cancel, exclusion constraint, `409` handling).
- Reminder and confirmation emails with `.ics`.

**Exit check:** 20 real bookings across at least 2 time zones with no
double bookings, correct reminders, and working Meet links.

## Phase 4 · Sessions and reporting (2 weeks)

- `sessions`: notes, action items, feedback, no-shows, AI draft.
- `reports`: programme and mentor dashboards, CSV export.

**Exit check:** over 80% of held sessions have a note within 48 hours;
the programme team reads the dashboard in their weekly review.

## Later

- Matching suggestions (tags, goals, past ratings).
- WhatsApp notifications.
- Outlook / Microsoft 365 calendars.
- Group sessions and office hours.
- Mentor honoraria or payments.
- Mobile-friendly PWA.
- Integration with Founders OS: link founders' Idea Lab and Discovery outputs to
  their mentor sessions, so mentors see context before a call.
