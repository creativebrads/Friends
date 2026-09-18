# Rolodex

An elevated, modern rolodex for the people who matter to you — friends, family, coworkers, anyone you want to build a stronger relationship with. Beyond the basics (contact info, birthdays, job details), it tracks the things that make a relationship personal: favorite meals and drinks, hobbies, memories and photos, family and mutual-friend connections — and it reminds you of upcoming dates, overdue check-ins, and events you might both enjoy.

## Stack

- **Next.js** (App Router, TypeScript) — one codebase for UI + server logic via Server Actions, no separate API layer
- **Prisma 7** + **SQLite** for local development — the schema is written to be Postgres-compatible, so swapping to a hosted Postgres database (e.g. Supabase) later is a config change, not a rewrite
- **Tailwind CSS** for styling

## Getting started

Requires [Node.js](https://nodejs.org) 22+ installed on your machine.

```bash
git clone https://github.com/creativebrads/Friends.git
cd Friends
npm install
cp .env.example .env      # then fill in the values — see comments in that file
npx prisma migrate dev    # creates the local SQLite database
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Notifications need a real VAPID keypair to work: run `npx web-push generate-vapid-keys` and paste the
output into `.env` as described in `.env.example`. Without that, everything else in the app still works
— only the "Enable notifications" button on Settings will be a no-op.

## Data model

- **Person** — name, contact info, job, category (friend/family/coworker/etc.), favorites, hobbies, active projects, notes
- **ImportantDate** — a generalized date (birthday, anniversary, graduation, job start, engagement, wedding, or custom), recurring or one-off
- **Memory** + **Photo** — journal entries tied to a person, with an `occurredOn` date and optional photos. A memory can also be tagged to one or more `ImportantDate`s, so a memory isn't just dated on its own — it can be grouped under a recurring occasion (e.g. every memory tagged "Anniversary"). This is what powers the **"on this day" flashback** on the dashboard: memories whose date matches today's month/day in a past year surface automatically, with tagged ones showing which occasion they belong to.
- **PersonRelationship** — links two people to each other (family members, mutual friends), rendered on both profiles
- **CheckIn** — a desired contact cadence per person (e.g. every 30 days) plus last-contacted date, used to surface "you haven't talked in a while" nudges
- **Event** — something you and specific people might want to attend together, matched loosely against interests
- **PushSubscription** — a browser's Web Push subscription, one row per device that's enabled notifications

## What's built (v1)

- Full CRUD for people, with an elevated profile page for each person
- Important dates with a "days away" countdown and a per-date, adjustable reminder lead time (e.g. a week out for an anniversary, the day before for a birthday)
- Memories with uploaded photos (or pasted URLs) and important-date tagging
- Family & mutual-friend connections between people
- Check-in cadence tracking with a "mark as contacted" action
- Events with an interested-people list
- A dashboard surfacing: today's memory flashbacks, dates coming up in the next 30 days, overdue check-ins, and events in the next 60 days
- Web Push notifications — enable them on the Settings page; the same reminder logic that drives the dashboard fires a notification once, at each item's meaningful moment (see "Reminders" below)

## Reminders & notifications

`GET /api/cron/reminders` (protected by the `CRON_SECRET` env var) computes what's due today and pushes it to every subscribed browser. There's no always-on process in this app to run its own daily timer, so once this is deployed somewhere with a scheduler (e.g. Vercel Cron), point it at that route once a day. Until then, use the "check reminders now" button on Settings to trigger it manually.

## Photo storage

Uploaded photos are written to `public/uploads/` on local disk (see `src/lib/uploads.ts`). That's fine for local dev or a single always-on server, but won't survive a serverless deploy with an ephemeral filesystem (e.g. Vercel) — swap that file for real object storage (Supabase Storage, S3, etc.) before deploying there. Every other part of the app only deals in the URL it returns, so the swap is contained to that one file.

## Not yet built

- Authentication (currently single-user, no login)
- SMS/text notifications (Web Push is built; Twilio SMS would be an alternative/addition)
- Deployment / hosted Postgres database / hosted object storage
