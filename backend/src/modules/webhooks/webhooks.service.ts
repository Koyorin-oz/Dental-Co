import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Role } from '@prisma/client';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(private readonly prisma: PrismaService) {}

  async handleUserCreated(data: Record<string, unknown>) {
    const clerkId = data.id as string;
    const email = (data.email_addresses as Array<{ email_address: string; id: string }>)?.[0]?.email_address;
    const firstName = (data.first_name as string) ?? '';
    const lastName = (data.last_name as string) ?? '';
    const phone = (data.phone_numbers as Array<{ phone_number: string }>)?.[0]?.phone_number ?? null;
    const role = ((data.public_metadata as Record<string, unknown>)?.role as Role) ?? null;

    if (!email) {
      this.logger.warn(`No email for Clerk user ${clerkId}, skipping`);
      return;
    }

    const existing = await this.prisma.db.user.findUnique({ where: { clerkId } });
    if (existing) {
      this.logger.log(`User ${clerkId} already exists, skipping creation`);
      return;
    }

    // Check if this email belongs to a manually-created patient profile (invite flow)
    const existingByEmail = await this.prisma.db.user.findUnique({ where: { email } });
    if (existingByEmail && existingByEmail.clerkId.startsWith('manual_')) {
      // Link the real Clerk account to the existing patient record
      await this.prisma.db.user.update({
        where: { id: existingByEmail.id },
        data: { clerkId, isActive: true },
      });
      // Invalidate invite token
      if (existingByEmail.role === Role.PATIENT) {
        await this.prisma.db.patientProfile.updateMany({
          where: { userId: existingByEmail.id },
          data: { inviteUsedAt: new Date(), inviteToken: null },
        });
      }
      this.logger.log(`Linked Clerk account ${clerkId} to existing user ${email}`);
      return;
    }

    // Only create if role is set — admin assigns roles first, then user signs up
    // If no role yet, create a bare user; role-specific profile added via admin endpoint
    await this.prisma.db.user.create({
      data: {
        clerkId,
        email,
        firstName,
        lastName,
        phone,
        role: role ?? Role.PATIENT,
      },
    });

    this.logger.log(`Created user ${email} (${role ?? 'PATIENT'})`);
  }

  async handleUserUpdated(data: Record<string, unknown>) {
    const clerkId = data.id as string;
    const firstName = (data.first_name as string) ?? undefined;
    const lastName = (data.last_name as string) ?? undefined;
    const email = (data.email_addresses as Array<{ email_address: string }>)?.[0]?.email_address;
    const role = ((data.public_metadata as Record<string, unknown>)?.role as Role) ?? undefined;

    await this.prisma.db.user.updateMany({
      where: { clerkId },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(email && { email }),
        ...(role && { role }),
      },
    });

    this.logger.log(`Updated user ${clerkId}`);
  }

  async handleUserDeleted(data: Record<string, unknown>) {
    const clerkId = data.id as string;
    await this.prisma.db.user.updateMany({
      where: { clerkId },
      data: { isActive: false },
    });
    this.logger.log(`Deactivated user ${clerkId}`);
  }
}
