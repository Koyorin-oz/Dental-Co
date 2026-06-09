import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { AppointmentStatus } from '@prisma/client';

@Injectable()
export class AppointmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async create(dto: CreateAppointmentDto) {
    const appt = await this.prisma.db.appointment.create({
      data: {
        doctorId: dto.doctorProfileId,
        patientId: dto.patientProfileId,
        startTime: new Date(dto.startTime),
        endTime: new Date(dto.endTime),
        reason: dto.reason,
        notes: dto.notes,
        isFirstVisit: dto.isFirstVisit ?? false,
        status: AppointmentStatus.SCHEDULED,
      },
      include: {
        doctor: { include: { user: true } },
        patient: { include: { user: true } },
      },
    });
    // Fire-and-forget — don't block the response
    this.notifications.sendConfirmation(appt.id).catch(() => null);
    return appt;
  }

  async findAll() {
    return this.prisma.db.appointment.findMany({
      include: {
        doctor: { include: { user: true } },
        patient: { include: { user: true } },
      },
      orderBy: { startTime: 'asc' },
    });
  }

  async findByDoctor(doctorProfileId: string) {
    return this.prisma.db.appointment.findMany({
      where: { doctorId: doctorProfileId },
      include: {
        doctor: { include: { user: true } },
        patient: { include: { user: true } },
      },
      orderBy: { startTime: 'asc' },
    });
  }

  async findByPatient(patientProfileId: string) {
    return this.prisma.db.appointment.findMany({
      where: { patientId: patientProfileId },
      include: { doctor: { include: { user: true } } },
      orderBy: { startTime: 'desc' },
    });
  }

  async findOne(id: string) {
    const appt = await this.prisma.db.appointment.findUnique({
      where: { id },
      include: {
        doctor: { include: { user: true } },
        patient: { include: { user: true } },
        visit: { include: { report: true } },
      },
    });
    if (!appt) throw new NotFoundException('Appointment not found');
    return appt;
  }

  async update(id: string, dto: UpdateAppointmentDto) {
    await this.findOne(id);
    return this.prisma.db.appointment.update({
      where: { id },
      data: {
        ...(dto.startTime && { startTime: new Date(dto.startTime) }),
        ...(dto.endTime && { endTime: new Date(dto.endTime) }),
        ...(dto.reason !== undefined && { reason: dto.reason }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
        ...(dto.isFirstVisit !== undefined && { isFirstVisit: dto.isFirstVisit }),
        ...(dto.status && { status: dto.status }),
      },
      include: {
        doctor: { include: { user: true } },
        patient: { include: { user: true } },
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.db.appointment.delete({ where: { id } });
    return { message: 'Appointment deleted' };
  }

  async updateStatus(id: string, status: AppointmentStatus) {
    const appt = await this.prisma.db.appointment.update({
      where: { id },
      data: { status },
    });
    if (status === AppointmentStatus.CANCELLED) {
      this.notifications.sendCancellation(id).catch(() => null);
    }
    return appt;
  }

  async findByCurrentDoctor(clerkId: string) {
    const user = await this.prisma.db.user.findUnique({
      where: { clerkId },
      include: { doctorProfile: true },
    });
if (!user?.doctorProfile) return [];
    return this.findByDoctor(user.doctorProfile.id);
  }

  async getDoctors() {
    return this.prisma.db.doctorProfile.findMany({
      include: { user: true },
      orderBy: { user: { lastName: 'asc' } },
    });
  }

  async getReceptionistStats() {
    const now = new Date();
    const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now); todayEnd.setHours(23, 59, 59, 999);
    const weekEnd = new Date(now); weekEnd.setDate(now.getDate() + 7); weekEnd.setHours(23, 59, 59, 999);

    const [todayCount, weekCount, pendingCount] = await Promise.all([
      this.prisma.db.appointment.count({
        where: { startTime: { gte: todayStart, lte: todayEnd } },
      }),
      this.prisma.db.appointment.count({
        where: {
          startTime: { gte: todayStart, lte: weekEnd },
          status: { notIn: [AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW] },
        },
      }),
      this.prisma.db.appointment.count({
        where: { status: AppointmentStatus.SCHEDULED },
      }),
    ]);

    return { todayCount, weekCount, pendingCount };
  }
}
