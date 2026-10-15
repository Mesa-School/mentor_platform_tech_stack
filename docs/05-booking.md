# 05 · Calendar booking

Booking is the hardest part of the product: it mixes time zones, external
calendars, concurrency and notifications. This doc is the design to build against.

## Rules

1. **Store every instant in UTC** (`timestamptz`). Store availability as
   local wall-clock times plus the mentor's IANA time zone, because "6–8 pm
   every Tuesday" must stay 6–8 pm across daylight-saving changes. India has no
   DST, but many mentors abroad do.
2. **Show times in the viewer's time zone**, always labelled ("7:30 pm IST").
3. **The database prevents double booking**, not the application (exclusion
   constraint in [03-data-model.md](03-data-model.md#constraints-prisma-cant-express)).
4. **Google Calendar is a source of busy time and a place to write events**,
   never the source of truth for bookings. Our `Booking` table is.

## Slot generation

`GET /mentors/:id/slots?from&to&duration&tz`:

```
1. Expand weekly rules into concrete intervals for each date in [from, to],
   in the mentor's time zone, then convert to UTC.
2. Apply date exceptions (remove days off, add extra hours).
3. Subtract busy time:
     - our own PENDING/CONFIRMED bookings (with buffers before and after),
     - Google free/busy for the mentor's selected calendars (if connected).
4. Remove anything earlier than now + minNoticeHours,
   or later than now + maxDaysAhead.
5. Cut remaining free intervals into slots of `duration`,
   starting on :00 / :15 / :30 / :45 boundaries.
6. Drop slots in weeks where the mentor has reached maxPerWeek.
7. Return slots in UTC; the frontend renders them in `tz`.
```

- **Google free/busy:** one call to `freebusy.query` for up to 30 days. Cache it
  per mentor for 2 minutes. The webhook also clears the cache when the mentor's
  calendar changes.
- **If Google is unreachable:** still return slots from our own data, and set
  `meta.calendarStale: true` so the UI can say "availability may be out of date".
  The booking-time check (below) protects against conflicts we can't see.
- Slot computation is a **pure function** of
  `(rules, exceptions, settings, bookings, busy, now)`, so it can be
  unit-tested without a database (`availability.slots.unit.test.ts`), including
  DST edge cases.

## Booking flow

```mermaid
sequenceDiagram
  participant Mt as Mentee
  participant API
  participant DB as Postgres
  participant Q as pg-boss
  participant G as Google Calendar

  Mt->>API: POST /bookings {mentorId, startsAt, duration, agenda}
  API->>API: recompute: slot still offered? (rules, notice, limits)
  API->>G: freebusy for that window (if connected; 3 s timeout)
  API->>DB: BEGIN; INSERT booking; INSERT jobs (sync event, reminders, emails); COMMIT
  alt overlap with another live booking
    DB-->>API: exclusion violation 23P01
    API-->>Mt: 409 SLOT_TAKEN
  else ok
    API-->>Mt: 201 booking (status CONFIRMED or PENDING)
    Q->>G: events.insert with conferenceData (Meet link), attendees
    Q->>DB: save googleEventId, meetUrl
    Q->>Mt: confirmation email (and to the mentor)
  end
```

- **Jobs are inserted in the same transaction as the booking**, so they exist
  only if the booking does.
- **If the mentor requires approval:** status is `PENDING`, the slot is held,
  the mentor gets an email with Accept and Decline buttons, and the booking
  expires to `DECLINED` after 48 hours (scheduled job). The Google event is
  created only on accept.
- **Meet links:** created by Google through `conferenceData.createRequest`
  (`conferenceSolutionKey.type = "hangoutsMeet"`) on the mentor's calendar. If
  the mentor has no Google connection, the event is created on a Mesa service
  calendar and the mentor is invited as an attendee.

## Reschedule and cancel

- **Reschedule:** a new booking is created with `rescheduledFrom` pointing at the
  old one, and the old one is cancelled, in one transaction. The Google event is
  updated (not deleted and recreated), so the Meet link stays the same.
- **Cancel:** allowed until `cancelCutoffHours` before the start (admins can
  always cancel). Cancellation deletes the Google event, cancels pending
  reminder jobs (they also check status before sending), and emails both sides.
- **Signed one-click links** in emails (expiring, single-purpose tokens) let
  people cancel or reschedule without signing in first, behind a confirmation page.

## Keeping in sync with Google

- **Watch channels:** on connect, call `events.watch` for each selected calendar.
  Google posts to `/calendar/google/webhook`. The handler checks the channel id
  and token, enqueues `calendar.pull-changes` and returns 200.
- `calendar.pull-changes` uses the stored **sync token** to fetch only what changed:
  - the mentor deleted our event in Google → flag the booking for the programme
    team (don't silently cancel);
  - the mentor added a conflicting event → flag the conflict and email the mentor;
  - otherwise → clear the free/busy cache.
- **Channels expire after about 7 days.** `calendar.refresh-watch` renews them daily.
- **If the token is revoked** (`invalid_grant`): mark the connection `revoked`,
  email the mentor to reconnect, and fall back to manual availability.

## Reminders and follow-up

| When | To | Content |
| --- | --- | --- |
| On booking | Both | Confirmation, Meet link, `.ics`, reschedule and cancel links |
| T−24h | Both | Reminder, agenda |
| T−1h | Both | Reminder with Meet link |
| T+1h | Both | Feedback request; the mentor also gets the note form |
| T+48h, if no note | Mentor | One nudge to write the session note |

Each reminder job runs at its scheduled time, re-reads the booking, and sends
only if it's still `CONFIRMED` and the time hasn't changed. (Reschedules
create new jobs; old ones see the change and skip.)

## Google OAuth scopes

Request the minimum:

- `https://www.googleapis.com/auth/calendar.freebusy` to read busy times.
- `https://www.googleapis.com/auth/calendar.events` to create and update our events.
- `openid email` to know which Google account was connected.

Avoid the full `calendar` scope. Using a restricted or sensitive scope means a
Google app verification, so plan **2–6 weeks for verification** before
launching to external mentors. Until then, test users can be added in the
Google Cloud console.

## Edge cases to test

- A slot on the day DST starts or ends in the mentor's time zone.
- Mentor in London, mentee in Bengaluru; the slot crosses midnight for one of them.
- Two mentees book the same slot within the same 100 ms (one gets `409`).
- The mentor deletes the event in Google; the mentor declines in Google.
- Google is down during booking; the token is revoked mid-week.
- A booking is rescheduled twice; reminders fire only for the final time.
- A mentor reaches `maxPerWeek`; the remaining slots that week disappear.
