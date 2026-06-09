import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { createClerkClient } from '@clerk/backend';
import { Role } from '@prisma/client';

@Injectable()
export class AdminService {
  private readonly clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

  constructor(private readonly prisma: PrismaService) {}

  async getUsers() {
    return this.prisma.db.user.findMany({
      include: {
        doctorProfile: true,
        receptionistProfile: true,
        patientProfile: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async assignRole(clerkId: string, role: Role) {
    const user = await this.prisma.db.user.findUnique({ where: { clerkId } });
    if (!user) throw new NotFoundException(`User ${clerkId} not found`);

    // Skip Clerk for manually-created patients (clerkId is a fake local id)
    if (!clerkId.startsWith('manual_')) {
      try {
        await this.clerk.users.updateUserMetadata(clerkId, {
          publicMetadata: { role },
        });
      } catch (e) {
        // Log but don't fail — DB is the source of truth; Clerk metadata is best-effort
        console.warn(`Clerk metadata update failed for ${clerkId}:`, (e as Error).message);
      }
    }

    const updated = await this.prisma.db.user.update({
      where: { clerkId },
      data: { role },
    });

    return { message: `Role ${role} assigned to ${updated.email}`, user: updated };
  }

  async createDoctorProfile(userId: string, dto: { specialty: string; licenseNumber: string; biography?: string; color?: string }) {
    const user = await this.prisma.db.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const existing = await this.prisma.db.doctorProfile.findUnique({ where: { userId } });
    if (existing) throw new ConflictException('Doctor profile already exists for this user');

    return this.prisma.db.doctorProfile.create({
      data: {
        userId,
        specialty: dto.specialty,
        licenseNumber: dto.licenseNumber,
        biography: dto.biography,
        color: dto.color ?? '#3B82F6',
      },
      include: { user: true },
    });
  }

  async getDoctors() {
    return this.prisma.db.doctorProfile.findMany({
      include: { user: true },
      orderBy: { user: { lastName: 'asc' } },
    });
  }

  async getAuditLogs() {
    return this.prisma.db.auditLog.findMany({
      include: { user: { select: { firstName: true, lastName: true, email: true, role: true } } },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  async deactivateUser(userId: string) {
    const user = await this.prisma.db.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    await this.prisma.db.user.update({
      where: { id: userId },
      data: { isActive: false },
    });

    return { message: `User ${user.email} deactivated` };
  }

  async deleteUser(userId: string) {
    const user = await this.prisma.db.user.findUnique({
      where: { id: userId },
      include: { patientProfile: true, doctorProfile: true },
    });
    if (!user) throw new NotFoundException('User not found');

    // Delete in dependency order to satisfy foreign key constraints
    if (user.patientProfile) {
      const profileId = user.patientProfile.id;

      // Delete notifications linked to this patient's appointments
      await this.prisma.db.notification.deleteMany({
        where: { appointment: { patientId: profileId } },
      });

      // Delete reports linked to visits
      await this.prisma.db.report.deleteMany({
        where: { visit: { patientId: profileId } },
      });

      // Delete visits
      await this.prisma.db.visit.deleteMany({ where: { patientId: profileId } });

      // Delete appointments
      await this.prisma.db.appointment.deleteMany({ where: { patientId: profileId } });
    }

    if (user.doctorProfile) {
      const profileId = user.doctorProfile.id;
      await this.prisma.db.notification.deleteMany({
        where: { appointment: { doctorId: profileId } },
      });
      await this.prisma.db.report.deleteMany({
        where: { visit: { doctorId: profileId } },
      });
      await this.prisma.db.visit.deleteMany({ where: { doctorId: profileId } });
      await this.prisma.db.appointment.deleteMany({ where: { doctorId: profileId } });
    }

    // Now safe to delete the user (cascade handles profile)
    await this.prisma.db.user.delete({ where: { id: userId } });
    return { message: `User ${user.email} deleted` };
  }

  async getStats() {
    const [totalUsers, totalDoctors, totalPatients, totalAuditEvents] = await Promise.all([
      this.prisma.db.user.count({ where: { isActive: true } }),
      this.prisma.db.doctorProfile.count(),
      this.prisma.db.user.count({ where: { role: Role.PATIENT, isActive: true } }),
      this.prisma.db.auditLog.count(),
    ]);
    return { totalUsers, totalDoctors, totalPatients, totalAuditEvents };
  }
}
