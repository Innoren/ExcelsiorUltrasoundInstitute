# Excelsior Ultrasound Institute

Complete **online school website** with a built-in learning portal.

Public school pages (program, curriculum, admissions, tuition, ARDMS prep, about, contact) plus portal areas for students, instructors, dean/campus ops, and owner admin — all under the same site chrome. No Clerk.

## Stack

- Next.js (App Router) + Tailwind + shadcn/ui
- Neon Postgres + Drizzle
- Cookie sessions (`AUTH_SECRET`) with email/password portal login

## Setup

```bash
cp .env.example .env.local
# set DATABASE_URL + AUTH_SECRET

npm install
npm run db:push
npm run db:seed
npm run dev
```

## Demo portal logins

| Role | Email | Password |
|------|-------|----------|
| Owner | owner@excelsior.local | owner123 |
| Dean | dean@excelsior.local | dean123 |
| Instructor | instructor@excelsior.local | teach123 |
| Student | student@excelsior.local | student123 |

## Site map

**Public**

- `/` Home
- `/program` `/curriculum` `/admissions` `/tuition` `/ardms-prep` `/about` `/contact`

**Portal**

- `/portal` Sign in
- `/learn` Student dashboard, courses, lessons, quizzes, grades
- `/teach` Instructor course builder + gradebook
- `/campus` Dean cohorts + enrollments
- `/admin` Owner command center (ops + financial KPIs)
- `/admin/financials` Tuition ledger, invoices, payments, expenses
