# Workflow: Phase 4 — Receptionist Module

## Status: COMPLETED ✓ (validated 2026-06-03, SMS/Twilio deferred to later)

## Objective
Multi-doctor appointment calendar with full CRUD, real-time sync via Supabase, and email/SMS notifications.

## Steps

### 4.1 Calendar Setup (FullCalendar.io)
- Install @fullcalendar/react, @fullcalendar/daygrid, @fullcalendar/timegrid, @fullcalendar/interaction
- Views: Day, Week, Month
- Each doctor's appointments shown in their assigned color (DoctorProfile.color)
- Doctor filter: show all or filter by specific doctor

### 4.2 Appointment CRUD
- Create: click on time slot → form modal (patient search, reason, duration)
- Edit: click existing appointment → edit modal
- Delete: with confirmation dialog
- Drag & drop to reschedule (FullCalendar interaction plugin)
- Status change: SCHEDULED → CONFIRMED → COMPLETED / CANCELLED / NO_SHOW

### 4.3 Real-Time Sync (Supabase Realtime)
- Subscribe to appointments table changes on the frontend
- Doctor dashboard also subscribes → sees new appointments immediately
- No polling needed — WebSocket-based via Supabase Realtime

### 4.4 Notifications (Resend + Twilio)
- On appointment creation → send confirmation email (Resend)
- 24h before appointment → reminder email + SMS (Twilio)
- On cancellation → cancellation email
- Backend: cron job runs every hour to send pending reminders
- Track in Notification table (status: PENDING | SENT | FAILED)

## Tools to Use
- tools/send_email.py (Resend API)
- tools/send_sms.py (Twilio API)

## Expected Output
- Receptionist can see all doctors' calendars and manage appointments without refresh
