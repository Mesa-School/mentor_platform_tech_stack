# 01 · Product

## The problem

Mesa runs programmes where founders and students learn from industry mentors.
Today the mentor side runs on spreadsheets, WhatsApp and email:

- **Finding and tracking mentors** lives in sheets. Nobody can see at a glance who
  was contacted, who said yes, who is active, or who went quiet.
- **Onboarding** is manual: collecting bios, photos, LinkedIn, expertise and
  availability, then chasing the missing pieces.
- **Booking a session** takes several messages back and forth to find a time,
  and invites are created by hand.
- **What happened in a session** is rarely written down, so advice and action
  items get lost, and the programme team can't see which mentors are helping.

## Users and roles

| Role | Who | What they do |
| --- | --- | --- |
| **Admin** | Mesa programme operations | Everything: manage mentors, pipelines, programmes, settings, reports |
| **Programme manager** | Owns one programme or cohort | Manage mentors and mentees within their programme; see its reports |
| **Mentor** | Industry expert | Complete onboarding, keep a profile and availability, accept sessions, write session notes |
| **Mentee** | Founder or student | Find mentors, book sessions, give feedback, track action items |

The backend boilerplate ships `ADMIN`, `MANAGER` and `USER` roles with row
scoping (admin sees all, manager sees their department, user sees their own).
We map **programme manager → `MANAGER`** with programmes as the "department",
and split `USER` into **`MENTOR`** and **`MENTEE`**. See
[03-data-model.md](03-data-model.md#roles).

## Product areas

### 1. Mentor CRM

A single record per mentor, from first contact to alumni.

- **Directory:** searchable, filterable list (expertise, industry, city, stage,
  availability, programme, rating).
- **Pipeline board:** kanban of mentor stages
  (`Prospect → Contacted → Interested → Onboarding → Active → Paused → Alumni`,
  plus `Declined`). Drag a card to change stage.
- **Profile:** bio, photo, LinkedIn, company and title, expertise tags, languages,
  time zone, session preferences, internal notes, owner (which team member
  manages the relationship).
- **Activity timeline:** every touch in one place: stage changes, notes, emails
  sent, sessions booked and held, feedback received.
- **Import:** bulk-add mentors from a CSV of the existing sheet.

### 2. Mentor onboarding

A guided flow that turns an "Interested" mentor into an "Active" one.

1. **Invite:** the team sends an invite link from the CRM.
2. **Profile:** the mentor fills a short multi-step form: background, expertise,
   what they can help with, how often they can mentor.
3. **LinkedIn:** paste a LinkedIn URL; the profile photo and headline are pulled
   in automatically (the same approach Founders OS uses).
4. **Agreement:** accept the mentor agreement and code of conduct.
5. **Calendar:** connect Google Calendar, or set availability manually.
6. **Review:** the team reviews and approves; the mentor becomes Active and
   visible to mentees.

Progress is saved after each step, and the team sees who is stuck where.

### 3. Calendar booking

Calendly-style booking, built in.

- Mentors set **availability**: weekly hours, session lengths, buffers,
  minimum notice, maximum sessions per week, and date exceptions (holidays).
- If Google Calendar is connected, **busy times are hidden** automatically.
- Mentees pick a mentor, choose a slot shown in **their own time zone**, add an
  agenda, and book. Depending on the mentor's setting, the booking is confirmed
  instantly or waits for the mentor to accept.
- A **calendar invite with a Google Meet link** goes to both sides.
- **Reschedule and cancel** links are in every email, with a cut-off before the session.
- **Reminders** 24 hours and 1 hour before.

Details: [05-booking.md](05-booking.md).

### 4. Sessions and follow-up

- After a session, the mentor fills a short **session note**: outcome,
  problems discussed, advice given, action items (owner and due date). The
  structure comes from the Founders OS check-in design.
- Optionally, paste a transcript or rough notes and let **AI draft** the note
  for the mentor to edit.
- Both sides give **feedback** (a 1–5 rating and a comment). Mentors can flag no-shows.
- **Action items** show up on the mentee's dashboard until they're done.

### 5. Admin and reporting

- Programme dashboards: active mentors, sessions booked and held, no-show rate,
  average rating, time from invite to active.
- Per-mentor stats: sessions, ratings, response time.
- Export to CSV.

## v1 scope

In: CRM directory and pipeline, onboarding flow, availability and booking with
Google Calendar and Meet, reminders by email, session notes and feedback,
basic admin dashboard, roles and programme scoping.

Out of v1 (later phases, see [08-roadmap.md](08-roadmap.md)): mentor–mentee
matching suggestions, WhatsApp notifications, payments or honoraria, Outlook
calendars, group sessions, a mobile app, a public mentor marketplace.

## Success measures

- Time from "Interested" to "Active" mentor: under 7 days.
- Messages needed to book a session: zero (self-serve).
- Share of held sessions with a session note: over 80%.
- No-show rate visible per programme, and falling.

## Decisions needed

1. **Who can book whom?** Any mentee with any active mentor, or only within the
   mentee's programme? (The data model supports programme scoping either way.)
2. **Instant booking or mentor approval?** Per-mentor setting, or one rule for all?
3. **Session limits:** a cap per mentee per month, per mentor per week, both?
4. **Mentee sign-in:** do mentees come from an existing Mesa system (single
   sign-on, roster import), or sign up here?
5. **Notes visibility:** can mentees see the mentor's session note, or only the
   action items?
6. **Brand and domain** for the product.
