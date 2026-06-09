import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateVisitDto, CreateReportDto } from './dto/create-visit.dto';
import { ReportStatus } from '@prisma/client';

@Injectable()
export class VisitsService {
  constructor(private readonly prisma: PrismaService) {}

  async findByCurrentDoctor(clerkId: string) {
    const user = await this.prisma.db.user.findUnique({
      where: { clerkId },
      include: { doctorProfile: true },
    });
    if (!user?.doctorProfile) return [];

    return this.prisma.db.visit.findMany({
      where: { doctorId: user.doctorProfile.id },
      include: {
        report: true,
        doctor: { include: { user: true } },
        patient: { include: { user: true } },
        appointment: true,
      },
      orderBy: { visitDate: 'desc' },
    });
  }

  async create(dto: CreateVisitDto) {
    return this.prisma.db.visit.create({
      data: {
        appointmentId: dto.appointmentId,
        patientId: dto.patientProfileId,
        doctorId: dto.doctorProfileId,
        visitDate: new Date(dto.visitDate),
        chiefComplaint: dto.chiefComplaint,
        report: { create: { status: ReportStatus.DRAFT } },
      },
      include: { report: true, doctor: { include: { user: true } } },
    });
  }

  async findOne(id: string) {
    const visit = await this.prisma.db.visit.findUnique({
      where: { id },
      include: {
        report: true,
        doctor: { include: { user: true } },
        patient: { include: { user: true } },
        appointment: true,
      },
    });
    if (!visit) throw new NotFoundException('Visit not found');
    return visit;
  }

  async saveReport(visitId: string, dto: CreateReportDto, doctorClerkId: string) {
    const visit = await this.findOne(visitId);
    if (!visit.report) throw new NotFoundException('Report not found for this visit');

    const doctor = await this.prisma.db.user.findUnique({ where: { clerkId: doctorClerkId } });

    return this.prisma.db.report.update({
      where: { visitId },
      data: {
        diagnosis: dto.diagnosis,
        treatment: dto.treatment,
        observations: dto.observations,
        prescription: dto.prescription,
        followUpIn: dto.followUpIn,
        status: ReportStatus.SIGNED,
        signedAt: new Date(),
        signedById: doctor?.id,
      },
    });
  }

  async saveDraft(visitId: string, dto: CreateReportDto) {
    await this.findOne(visitId);
    return this.prisma.db.report.update({
      where: { visitId },
      data: { ...dto, status: ReportStatus.DRAFT },
    });
  }
}
