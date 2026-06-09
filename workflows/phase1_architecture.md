# Workflow: Phase 1 — Architecture & Foundation

## Status: COMPLETED

## Objective
Initialize the full monorepo with Next.js 14 frontend, NestJS backend, Prisma schema, and WAT framework structure.

## Stack Decisions (locked)
- Frontend: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- Backend: NestJS + TypeScript
- Database: PostgreSQL via Supabase + Prisma ORM
- Auth: Clerk (roles: Admin, Doctor, Receptionist, Patient)
- Speech-to-text: OpenAI Whisper API
- Report AI: Claude API (claude-sonnet-4-6)
- Calendar: FullCalendar.io
- Email: Resend
- SMS: Twilio
- Hosting: Vercel (frontend) + Supabase (backend)
- Tests: Playwright (E2E) + Jest (unit)
- Location: UAE (UAE PDPL compliance, no HDS requirement)

## Directory Structure
```
/
├── frontend/         # Next.js 14 App Router
│   └── src/
│       ├── app/      # App Router pages & layouts
│       ├── components/
│       ├── lib/      # utilities, API clients
│       └── types/    # TypeScript interfaces
├── backend/          # NestJS API
│   ├── src/
│   │   ├── modules/  # feature modules (auth, patients, appointments, etc.)
│   │   ├── common/   # guards, interceptors, pipes
│   │   └── prisma/   # Prisma service
│   └── prisma/
│       ├── schema.prisma
│       └── seed.ts
├── workflows/        # WAT: Markdown SOPs
├── tools/            # WAT: Python scripts
├── .tmp/             # Temporary files (disposable)
├── .env.example      # Environment variable template
├── .env              # Actual env vars (gitignored)
└── package.json      # Monorepo root scripts
```

## Database Tables (Prisma Schema)
- `users` — all users with role field
- `doctor_profiles` — specialty, license, working hours
- `receptionist_profiles` — linked to user
- `patient_profiles` — medical history, allergies, emergency contact
- `appointments` — scheduling with status lifecycle
- `visits` — completed appointment records
- `reports` — medical reports with transcription + AI structuring
- `notifications` — email/SMS tracking
- `audit_logs` — access trail for PDPL compliance

## Completed Steps
1. ✅ NestJS backend scaffolded
2. ✅ Next.js 14 frontend scaffolded (App Router + TypeScript + Tailwind)
3. ✅ Prisma schema written (all tables)
4. ✅ Prisma + @prisma/client installed in backend
5. ✅ Monorepo root package.json with dev/build/db scripts
6. ✅ .env.example with all required variables
7. ✅ .gitignore configured
8. ✅ WAT folders: workflows/, tools/, .tmp/

## Next Steps → Phase 2
Install remaining backend dependencies (Clerk SDK, Prisma service module)
then proceed to Phase 2: Authentication & Role System.
