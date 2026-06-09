import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { Role } from '@prisma/client';
import { randomBytes } from 'crypto';

@Injectable()
export class PatientsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async findAll(search?: string) {
    const where = search
      ? {
          role: Role.PATIENT,
          isActive: true,
          OR: [
            { firstName: { contains: search, mode: 'insensitive' as const } },
            { lastName: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
            { phone: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : { role: Role.PATIENT, isActive: true };

    return this.prisma.db.user.findMany({
      where,
      include: { patientProfile: true },
      orderBy: { lastName: 'asc' },
    });
  }

  async findOne(id: string) {
    const patient = await this.prisma.db.user.findFirst({
      where: { id, role: Role.PATIENT, isActive: true },
      include: { patientProfile: true },
    });
    if (!patient) throw new NotFoundException('Patient not found');
    return patient;
  }

  async getVisitHistory(patientId: string) {
    const profile = await this.prisma.db.patientProfile.findFirst({
      where: { userId: patientId },
    });
    if (!profile) throw new NotFoundException('Patient profile not found');

    return this.prisma.db.visit.findMany({
      where: { patientId: profile.id },
      include: {
        doctor: { include: { user: true } },
        report: true,
        appointment: true,
      },
      orderBy: { visitDate: 'desc' },
    });
  }

  // Called by the patient portal — uses clerkId to find the patient
  async getMyProfile(clerkId: string) {
    const user = await this.prisma.db.user.findUnique({
      where: { clerkId },
      include: { patientProfile: true },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async getMyAppointments(clerkId: string) {
    const user = await this.prisma.db.user.findUnique({
      where: { clerkId },
      include: { patientProfile: true },
    });
    if (!user?.patientProfile) throw new NotFoundException('Patient profile not found');

    return this.prisma.db.appointment.findMany({
      where: { patientId: user.patientProfile.id },
      include: { doctor: { include: { user: true } } },
      orderBy: { startTime: 'asc' },
    });
  }

  async getMyVisits(clerkId: string) {
    const user = await this.prisma.db.user.findUnique({
      where: { clerkId },
      include: { patientProfile: true },
    });
    if (!user?.patientProfile) throw new NotFoundException('Patient profile not found');

    return this.prisma.db.visit.findMany({
      where: { patientId: user.patientProfile.id },
      include: {
        doctor: { include: { user: true } },
        report: true,
        appointment: true,
      },
      orderBy: { visitDate: 'desc' },
    });
  }

  async getMyReport(clerkId: string, visitId: string) {
    const user = await this.prisma.db.user.findUnique({
      where: { clerkId },
      include: { patientProfile: true },
    });
    if (!user?.patientProfile) throw new NotFoundException('Patient profile not found');

    const visit = await this.prisma.db.visit.findFirst({
      where: { id: visitId, patientId: user.patientProfile.id },
      include: {
        report: true,
        doctor: { include: { user: true } },
        appointment: true,
      },
    });
    if (!visit) throw new NotFoundException('Visit not found');
    if (!visit.report || visit.report.status !== 'SIGNED') {
      throw new NotFoundException('No signed report available for this visit');
    }
    return visit;
  }

  async create(dto: CreatePatientDto) {
    const existing = await this.prisma.db.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('A user with this email already exists');

    const inviteToken = randomBytes(32).toString('hex');

    const newPatient = await this.prisma.db.user.create({
      data: {
        clerkId: `manual_${randomBytes(8).toString('hex')}`,
        email: dto.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        role: Role.PATIENT,
        patientProfile: {
          create: {
            dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
            gender: dto.gender,
            address: dto.address,
            city: dto.city,
            bloodType: dto.bloodType,
            allergies: dto.allergies ?? [],
            medicalNotes: dto.medicalNotes,
            emergencyContactName: dto.emergencyContactName,
            emergencyContactPhone: dto.emergencyContactPhone,
            emiratesId: dto.emiratesId,
            inviteToken,
          },
        },
      },
      include: { patientProfile: true },
    });

    // Send invite email (fire-and-forget)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
    this.notifications.sendInvite(newPatient.id, appUrl).catch(() => null);

    return newPatient;
  }

  async update(id: string, dto: Partial<CreatePatientDto>) {
    const patient = await this.findOne(id);
    const profile = patient.patientProfile;

    await this.prisma.db.user.update({
      where: { id },
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
      },
    });

    if (profile) {
      await this.prisma.db.patientProfile.update({
        where: { id: profile.id },
        data: {
          dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
          gender: dto.gender,
          address: dto.address,
          city: dto.city,
          bloodType: dto.bloodType,
          allergies: dto.allergies,
          medicalNotes: dto.medicalNotes,
          emergencyContactName: dto.emergencyContactName,
          emergencyContactPhone: dto.emergencyContactPhone,
          emiratesId: dto.emiratesId,
        },
      });
    }

    return this.findOne(id);
  }

  async delete(id: string) {
    const patient = await this.findOne(id);
    const profile = patient.patientProfile;

    if (profile) {
      await this.prisma.db.notification.deleteMany({
        where: { appointment: { patientId: profile.id } },
      });
      await this.prisma.db.report.deleteMany({
        where: { visit: { patientId: profile.id } },
      });
      await this.prisma.db.visit.deleteMany({ where: { patientId: profile.id } });
      await this.prisma.db.appointment.deleteMany({ where: { patientId: profile.id } });
    }

    await this.prisma.db.user.delete({ where: { id } });
    return { message: `Patient ${patient.firstName} ${patient.lastName} deleted` };
  }

  async getInviteByToken(token: string) {
    const profile = await this.prisma.db.patientProfile.findUnique({
      where: { inviteToken: token },
      include: { user: true },
    });
    if (!profile || profile.inviteUsedAt) throw new NotFoundException('Invalid or expired invite link');
    return profile;
  }

  async useInviteToken(token: string, clerkId: string) {
    const profile = await this.prisma.db.patientProfile.findUnique({
      where: { inviteToken: token },
      include: { user: true },
    });
    if (!profile || profile.inviteUsedAt) throw new NotFoundException('Invalid or expired invite token');

    // Link the new Clerk account to the existing user record
    await this.prisma.db.user.update({
      where: { id: profile.userId },
      data: { clerkId, isActive: true },
    });

    await this.prisma.db.patientProfile.update({
      where: { id: profile.id },
      data: { inviteUsedAt: new Date(), inviteToken: null },
    });

    return { message: 'Account linked successfully' };
  }
}
