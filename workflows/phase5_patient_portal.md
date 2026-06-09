# Workflow: Phase 5 — Patient Portal

## Status: COMPLETED ✓ (validated 2026-06-03)

## Objective
Patient-facing dashboard: view upcoming appointment, visit history, and signed medical reports with PDF download.

## Steps

### 5.1 Patient Dashboard
- Next appointment card (date, time, doctor name)
- Chronological visit history list
- Access to signed reports

### 5.2 Report Access
- Patient sees only SIGNED reports (not DRAFT)
- Report detail page: diagnosis, treatment, observations, prescription
- PDF download (generate on demand using a PDF library like @react-pdf/renderer or puppeteer)

### 5.3 Account Creation via Email Invite
- Receptionist creates patient in system → system sends invite email (Resend)
- Email contains unique invite link with token: /invite?token=xxx
- Patient clicks link → Clerk sign-up page with pre-filled email
- On sign-up → Clerk webhook fires → link Clerk user to existing PatientProfile
- Invalidate invite token after use

## Tools to Use
- tools/send_email.py (for invite emails)

## Expected Output
- Patient logs in → sees their appointments and can download signed reports
