import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { IsEnum } from 'class-validator';
import { AppointmentStatus } from '@prisma/client';

class UpdateStatusDto {
  @IsEnum(AppointmentStatus) status: AppointmentStatus;
}

@Controller('appointments')
@UseGuards(ClerkAuthGuard, RolesGuard)
@Roles('DOCTOR', 'RECEPTIONIST', 'ADMIN')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Get('doctors')
  getDoctors() {
    return this.appointmentsService.getDoctors();
  }

  @Get('mine')
  @Roles('DOCTOR', 'ADMIN')
  getMyAppointments(@CurrentUser() user: { clerkId: string }) {
    return this.appointmentsService.findByCurrentDoctor(user.clerkId);
  }

  @Get('stats')
  getStats() {
    return this.appointmentsService.getReceptionistStats();
  }

  @Get()
  findAll() {
    return this.appointmentsService.findAll();
  }

  @Post()
  create(@Body() dto: CreateAppointmentDto) {
    return this.appointmentsService.create(dto);
  }

  @Get('doctor/:profileId')
  findByDoctor(@Param('profileId') profileId: string) {
    return this.appointmentsService.findByDoctor(profileId);
  }

  @Get('patient/:profileId')
  findByPatient(@Param('profileId') profileId: string) {
    return this.appointmentsService.findByPatient(profileId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.appointmentsService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAppointmentDto) {
    return this.appointmentsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.appointmentsService.remove(id);
  }

  @Put(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateStatusDto) {
    return this.appointmentsService.updateStatus(id, dto.status);
  }
}
