# Rolodex

An elevated, modern rolodex for the people who matter to you — friends, family, coworkers, anyone you want to build a stronger relationship with. Beyond the basics (contact info, birthdays, job details), it tracks the things that make a relationship personal: favorite meals and drinks, hobbies, memories and photos, family and mutual-friend connections — and it reminds you of upcoming dates, overdue check-ins, and events you might both enjoy.

## Stack

- **Next.js** (App Router, TypeScript) — one codebase for UI + server logic via Server Actions, no separate API layer
- **Prisma 7** + **SQLite** for local development — the schema is written to be Postgres-compatible, so swapping to a hosted Postgres database (e.g. Supabase) later is a config change, not a rewrite
- **Tailwind CSS** for styling

## Getting started

```bash
npm install
npx prisma migrate dev   # creates the local SQLite database
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Data model

- **Person** — name, contact info, job, category (friend/family/coworker/etc.), favorites, hobbies, active projects, notes
- **ImportantDate** — a generalized date (birthday, anniversary, graduation, job start, engagement, wedding, or custom), recurring or one-off
- **Memory** + **Photo** — journal entries tied to a person, with an `occurredOn` date and optional photos. A memory can also be tagged to one or more `ImportantDate`s, so a memory isn't just dated on its own — it can be grouped under a recurring occasion (e.g. every memory tagged "Anniversary"). This is what powers the **"on this day" flashback** on the dashboard: memories whose date matches today's month/day in a past year surface automatically, with tagged ones showing which occasion they belong to.
- **PersonRelationship** — links two people to each other (family members, mutual friends), rendered on both profiles
- **CheckIn** — a desired contact cadence per person (e.g. every 30 days) plus last-contacted date, used to surface "you haven't talked in a while" nudges
- **Event** — something you and specific people might want to attend together, matched loosely against interests

## What's built (v1)

- Full CRUD for people, with an elevated profile page for each person
- Important dates with "days away" countdown
- Memories with photos and important-date tagging
- Family & mutual-friend connections between people
- Check-in cadence tracking with a "mark as contacted" action
- Events with an interested-people list
- A dashboard surfacing: today's memory flashbacks, dates coming up in the next 30 days, overdue check-ins, and events in the next 60 days

## Not yet built

- Authentication (currently single-user, no login)
- Push/text notifications — the dashboard is the reminder surface for now; wiring up Web Push or SMS (Twilio) is the next major piece
- Photo upload (photos are stored as URLs for now, not uploaded files)
- Deployment / hosted Postgres database
