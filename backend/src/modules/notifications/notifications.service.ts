import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Resend } from 'resend';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationChannel, NotificationType } from '@prisma/client';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly resend = new Resend(process.env.RESEND_API_KEY);
  private readonly from = process.env.EMAIL_FROM ?? 'Dental Clinic <noreply@example.com>';

  constructor(private readonly prisma: PrismaService) {}

  async sendInvite(patientUserId: string, appUrl: string) {
    const user = await this.prisma.db.user.findUnique({
      where: { id: patientUserId },
      include: { patientProfile: true },
    });
    if (!user?.patientProfile?.inviteToken || !user.email) return;

    const inviteUrl = `${appUrl}/invite?token=${user.patientProfile.inviteToken}`;
    const html = this.baseTemplate('You\'ve been added to our dental clinic 🦷', `
      <p style="color:#374151">Hello ${user.firstName},</p>
      <p style="color:#374151">Your patient profile has been created at our clinic. Click the button below to set up your account and access your appointments and medical reports.</p>
      <div style="text-align:center;margin:32px 0">
        <a href="${inviteUrl}" style="background:#3B82F6;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px">
          Set Up My Account
        </a>
      </div>
      <p style="color:#6B7280;font-size:13px">Or copy this link: <a href="${inviteUrl}" style="color:#3B82F6">${inviteUrl}</a></p>
      <p style="color:#9CA3AF;font-size:12px">This link expires once used.</p>`);

    await this.sendEmail({
      appointmentId: null,
      type: NotificationType.ACCOUNT_INVITE,
      to: user.email,
      subject: 'Set up your patient account',
      html,
    });
  }

  async sendConfirmation(appointmentId: string) {
    const appt = await this.getAppointmentWithDetails(appointmentId);
    if (!appt || !appt.patient.user.email) return;

    const subject = 'Appointment Confirmed';
    const html = this.confirmationTemplate(appt);

    await this.sendEmail({
      appointmentId,
      type: NotificationType.APPOINTMENT_CONFIRMATION,
      to: appt.patient.user.email,
      subject,
      html,
    });
  }

  async sendCancellation(appointmentId: string) {
    const appt = await this.getAppointmentWithDetails(appointmentId);
    if (!appt || !appt.patient.user.email) return;

    const subject = 'Appointment Cancelled';
    const html = this.cancellationTemplate(appt);

    await this.sendEmail({
      appointmentId,
      type: NotificationType.APPOINTMENT_CANCELLED,
      to: appt.patient.user.email,
      subject,
      html,
    });
  }

  // Runs every hour — sends 24h reminders for upcoming appointments
  @Cron(CronExpression.EVERY_HOUR)
  async sendReminders() {
    const now = new Date();
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const in23h = new Date(now.getTime() + 23 * 60 * 60 * 1000);

    // Find appointments starting in ~24h that haven't been reminded yet
    const appointments = await this.prisma.db.appointment.findMany({
      where: {
        startTime: { gte: in23h, lte: in24h },
        status: { in: ['SCHEDULED', 'CONFIRMED'] },
        notifications: {
          none: { type: NotificationType.APPOINTMENT_REMINDER_24H },
        },
      },
      include: {
        doctor: { include: { user: true } },
        patient: { include: { user: true } },
      },
    });

    for (const appt of appointments) {
      if (!appt.patient.user.email) continue;
      await this.sendEmail({
        appointmentId: appt.id,
        type: NotificationType.APPOINTMENT_REMINDER_24H,
        to: appt.patient.user.email,
        subject: 'Reminder: Appointment Tomorrow',
        html: this.reminderTemplate(appt),
      });
    }

    if (appointments.length > 0) {
      this.logger.log(`Sent ${appointments.length} reminder email(s)`);
    }
  }

  private async sendEmail({
    appointmentId,
    type,
    to,
    subject,
    html,
  }: {
    appointmentId: string | null;
    type: NotificationType;
    to: string;
    subject: string;
    html: string;
  }) {
    // Create notification record (PENDING)
    const notification = await this.prisma.db.notification.create({
      data: {
        appointmentId,
        type,
        channel: NotificationChannel.EMAIL,
        recipientEmail: to,
        status: 'PENDING',
      },
    });

    if (!process.env.RESEND_API_KEY) {
      this.logger.warn(`RESEND_API_KEY not set — skipping email to ${to} (${type})`);
      return;
    }

    try {
      await this.resend.emails.send({ from: this.from, to, subject, html });
      await this.prisma.db.notification.update({
        where: { id: notification.id },
        data: { status: 'SENT', sentAt: new Date() },
      });
      this.logger.log(`Email sent: ${type} → ${to}`);
    } catch (err) {
      await this.prisma.db.notification.update({
        where: { id: notification.id },
        data: { status: 'FAILED', errorMessage: (err as Error).message },
      });
      this.logger.error(`Email failed: ${type} → ${to}: ${(err as Error).message}`);
    }
  }

  private async getAppointmentWithDetails(id: string) {
    return this.prisma.db.appointment.findUnique({
      where: { id },
      include: {
        doctor: { include: { user: true } },
        patient: { include: { user: true } },
      },
    });
  }

  private formatDateTime(date: Date) {
    return date.toLocaleString('en-AE', {
      weekday: 'long', year: 'numeric', month: 'long',
      day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  }

  private baseTemplate(title: string, body: string) {
    return `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#fff">
        <div style="border-bottom:2px solid #3B82F6;padding-bottom:16px;margin-bottom:24px">
          <h1 style="color:#3B82F6;font-size:20px;margin:0">🦷 Dental Clinic</h1>
        </div>
        <h2 style="color:#111827;font-size:18px;margin:0 0 16px">${title}</h2>
        ${body}
        <p style="color:#9CA3AF;font-size:12px;margin-top:32px;border-top:1px solid #F3F4F6;padding-top:16px">
          This is an automated message from the Dental Clinic management system.
        </p>
      </div>`;
  }

  private confirmationTemplate(appt: { startTime: Date; doctor: { user: { firstName: string; lastName: string } }; patient: { user: { firstName: string } }; reason?: string | null }) {
    return this.baseTemplate('Appointment Confirmed ✓', `
      <p style="color:#374151">Dear ${appt.patient.user.firstName},</p>
      <p style="color:#374151">Your appointment has been confirmed with the following details:</p>
      <div style="background:#F9FAFB;border-radius:8px;padding:16px;margin:16px 0">
        <p style="margin:4px 0;color:#374151"><strong>Doctor:</strong> Dr. ${appt.doctor.user.firstName} ${appt.doctor.user.lastName}</p>
        <p style="margin:4px 0;color:#374151"><strong>Date & Time:</strong> ${this.formatDateTime(new Date(appt.startTime))}</p>
        ${appt.reason ? `<p style="margin:4px 0;color:#374151"><strong>Reason:</strong> ${appt.reason}</p>` : ''}
      </div>
      <p style="color:#374151">Please arrive 10 minutes early. If you need to reschedule, contact us as soon as possible.</p>`);
  }

  private reminderTemplate(appt: { startTime: Date; doctor: { user: { firstName: string; lastName: string } }; patient: { user: { firstName: string } } }) {
    return this.baseTemplate('Reminder: Your Appointment is Tomorrow 🗓️', `
      <p style="color:#374151">Dear ${appt.patient.user.firstName},</p>
      <p style="color:#374151">This is a friendly reminder about your upcoming appointment:</p>
      <div style="background:#EFF6FF;border-left:4px solid #3B82F6;border-radius:4px;padding:16px;margin:16px 0">
        <p style="margin:4px 0;color:#1D4ED8"><strong>Doctor:</strong> Dr. ${appt.doctor.user.firstName} ${appt.doctor.user.lastName}</p>
        <p style="margin:4px 0;color:#1D4ED8"><strong>Date & Time:</strong> ${this.formatDateTime(new Date(appt.startTime))}</p>
      </div>
      <p style="color:#374151">Please remember to bring any relevant medical documents or X-rays.</p>`);
  }

  private cancellationTemplate(appt: { startTime: Date; doctor: { user: { firstName: string; lastName: string } }; patient: { user: { firstName: string } } }) {
    return this.baseTemplate('Appointment Cancelled', `
      <p style="color:#374151">Dear ${appt.patient.user.firstName},</p>
      <p style="color:#374151">Your appointment has been cancelled:</p>
      <div style="background:#FEF2F2;border-left:4px solid #EF4444;border-radius:4px;padding:16px;margin:16px 0">
        <p style="margin:4px 0;color:#B91C1C"><strong>Doctor:</strong> Dr. ${appt.doctor.user.firstName} ${appt.doctor.user.lastName}</p>
        <p style="margin:4px 0;color:#B91C1C"><strong>Was scheduled for:</strong> ${this.formatDateTime(new Date(appt.startTime))}</p>
      </div>
      <p style="color:#374151">Please contact us to reschedule at your earliest convenience.</p>`);
  }
}
