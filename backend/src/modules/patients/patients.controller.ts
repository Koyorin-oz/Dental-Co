import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { PatientsService } from './patients.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('patients')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  // ── Invite token — no auth needed (token is the secret) ─────
  @Get('invite/:token')
  getInvite(@Param('token') token: string) {
    return this.patientsService.getInviteByToken(token);
  }

  @Post('invite/:token/use')
  @UseGuards(ClerkAuthGuard, RolesGuard)
  @Roles('PATIENT', 'DOCTOR', 'RECEPTIONIST', 'ADMIN')
  useInvite(
    @Param('token') token: string,
    @CurrentUser() user: { clerkId: string },
  ) {
    return this.patientsService.useInviteToken(token, user.clerkId);
  }

  // ── Patient self-service routes ──────────────────────────────
  @Get('me')
  @UseGuards(ClerkAuthGuard, RolesGuard)
  @Roles('PATIENT')
  getMyProfile(@CurrentUser() user: { clerkId: string }) {
    return this.patientsService.getMyProfile(user.clerkId);
  }

  @Get('me/appointments')
  @UseGuards(ClerkAuthGuard, RolesGuard)
  @Roles('PATIENT')
  getMyAppointments(@CurrentUser() user: { clerkId: string }) {
    return this.patientsService.getMyAppointments(user.clerkId);
  }

  @Get('me/visits')
  @UseGuards(ClerkAuthGuard, RolesGuard)
  @Roles('PATIENT')
  getMyVisits(@CurrentUser() user: { clerkId: string }) {
    return this.patientsService.getMyVisits(user.clerkId);
  }

  @Get('me/visits/:visitId/report')
  @UseGuards(ClerkAuthGuard, RolesGuard)
  @Roles('PATIENT')
  getMyReport(
    @CurrentUser() user: { clerkId: string },
    @Param('visitId') visitId: string,
  ) {
    return this.patientsService.getMyReport(user.clerkId, visitId);
  }

  // ── Staff routes ─────────────────────────────────────────────
  @Get()
  @UseGuards(ClerkAuthGuard, RolesGuard)
  @Roles('DOCTOR', 'RECEPTIONIST', 'ADMIN')
  findAll(@Query('search') search?: string) {
    return this.patientsService.findAll(search);
  }

  @Get(':id')
  @UseGuards(ClerkAuthGuard, RolesGuard)
  @Roles('DOCTOR', 'RECEPTIONIST', 'ADMIN')
  findOne(@Param('id') id: string) {
    return this.patientsService.findOne(id);
  }

  @Get(':id/visits')
  @UseGuards(ClerkAuthGuard, RolesGuard)
  @Roles('DOCTOR', 'RECEPTIONIST', 'ADMIN')
  getVisitHistory(@Param('id') id: string) {
    return this.patientsService.getVisitHistory(id);
  }

  @Post()
  @UseGuards(ClerkAuthGuard, RolesGuard)
  @Roles('DOCTOR', 'RECEPTIONIST', 'ADMIN')
  create(@Body() dto: CreatePatientDto) {
    return this.patientsService.create(dto);
  }

  @Put(':id')
  @UseGuards(ClerkAuthGuard, RolesGuard)
  @Roles('DOCTOR', 'RECEPTIONIST', 'ADMIN')
  update(@Param('id') id: string, @Body() dto: Partial<CreatePatientDto>) {
    return this.patientsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(ClerkAuthGuard, RolesGuard)
  @Roles('RECEPTIONIST', 'DOCTOR', 'ADMIN')
  delete(@Param('id') id: string) {
    return this.patientsService.delete(id);
  }
}
