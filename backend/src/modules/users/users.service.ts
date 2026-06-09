import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Role, ReportStatus } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getMe(clerkId: string) {
    const user = await this.prisma.db.user.findUnique({
      where: { clerkId },
      include: {
        doctorProfile: true,
        receptionistProfile: true,
        patientProfile: true,
      },
    });
    if (!user) throw new NotFoundException('User not found');

    let stats: Record<string, number> | null = null;

    if (user.doctorProfile) {
      const profileId = user.doctorProfile.id;
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      const [todayAppointments, totalPatients, pendingReports] =
        await Promise.all([
          this.prisma.db.appointment.count({
            where: {
              doctorId: profileId,
              startTime: { gte: todayStart, lte: todayEnd },
            },
          }),
          this.prisma.db.user.count({
            where: { role: Role.PATIENT, isActive: true },
          }),
          this.prisma.db.report.count({
            where: {
              status: ReportStatus.DRAFT,
              visit: { doctorId: profileId },
            },
          }),
        ]);

      stats = { todayAppointments, totalPatients, pendingReports };
    }

    return { ...user, stats };
  }
}
