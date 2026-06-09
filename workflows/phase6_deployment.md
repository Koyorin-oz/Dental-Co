# Workflow: Phase 6 — Deployment, Security & Compliance

## Status: COMPLETED ✓ (validated 2026-06-04 — test deployment, template project)
## Note: This is a template. For real clinic deployments, complete: Clerk live keys, production Supabase (Singapore/UAE region), E2E tests, domain setup.

## Objective
Deploy to production (Vercel + Supabase), harden security, achieve UAE PDPL compliance, run full test suite.

## Steps

### 6.1 Hosting Setup
- Frontend → Vercel (connect GitHub repo, set env vars)
- Backend → Vercel Serverless or Railway (NestJS needs a persistent server; use Railway)
- Database → Supabase (managed PostgreSQL, already set up)
- Run: npx prisma migrate deploy (production migration)

### 6.2 Security Hardening
- HTTPS enforced everywhere (Vercel handles frontend, Railway handles backend)
- Helmet.js on NestJS (security headers)
- Rate limiting on all API endpoints (NestJS Throttler)
- CORS: restrict to production frontend URL only
- All sensitive data encrypted at rest (Supabase handles at database level)
- JWT rotation + refresh token strategy

### 6.3 UAE PDPL Compliance
- Data minimization: only collect what's needed
- Access logs: AuditLog table records every sensitive data access
- Retention policy: define how long to keep patient data
- Right to access / right to deletion: admin endpoints for data export/deletion
- Privacy policy page on the site

### 6.4 Testing
- Playwright E2E tests: login flows, appointment creation, report generation
- Jest unit tests: NestJS services, utility functions
- Test all 4 user roles end-to-end

### 6.5 Backups
- Supabase automated daily backups (enabled by default on paid plan)
- Export backup to external storage (optional: Supabase → S3 via cron)

## Expected Output
- Production URL live, all roles working, data secure, tests passing
