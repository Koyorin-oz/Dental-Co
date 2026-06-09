# Workflow: Phase 2 — Authentication & Role System

## Status: COMPLETED ✓ (validated 2026-06-02)

## Objective
Implement Clerk-based authentication with 4 roles and role-based routing.

## Inputs Required
- Clerk account created at https://clerk.com
- NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY in .env

## Steps

### 2.1 Clerk Setup
- Install @clerk/nextjs in frontend
- Install @clerk/backend (or @clerk/clerk-sdk-node) in backend
- Wrap frontend layout with <ClerkProvider>
- Configure Clerk roles via Clerk dashboard (Admin, Doctor, Receptionist, Patient)
- Set up Clerk webhooks to sync user creation to our database

### 2.2 Middleware & Route Protection
- Create middleware.ts in frontend (Next.js middleware for Clerk)
- Define protected routes per role:
  - /dashboard/doctor/* → DOCTOR only
  - /dashboard/receptionist/* → RECEPTIONIST only
  - /dashboard/patient/* → PATIENT only
  - /dashboard/admin/* → ADMIN only
- Backend: NestJS AuthGuard + RolesGuard using Clerk JWT

### 2.3 Role-Based Dashboards
- /dashboard → redirects to role-specific dashboard on login
- Doctor dashboard shell (sidebar: patients, calendar, reports)
- Receptionist dashboard shell (sidebar: calendar, appointments)
- Patient dashboard shell (sidebar: my visits, my reports, next appointment)

### 2.4 User Sync (Webhook)
- Clerk webhook → NestJS endpoint POST /webhooks/clerk
- On user.created: create User + role profile in database
- On user.updated: sync email/name changes
- Validate webhook signature with Clerk signing secret

## Tools to Use
- tools/sync_clerk_user.py (if needed for batch import)

## Expected Output
- Any authenticated user is redirected to their role dashboard
- Unauthenticated users → /sign-in
- Wrong role → 403 page
