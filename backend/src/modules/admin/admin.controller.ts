import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { IsEnum, IsString, IsOptional } from 'class-validator';
import { AdminService } from './admin.service';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

class AssignRoleDto {
  @IsEnum(Role) role: Role;
}

class CreateDoctorProfileDto {
  @IsString() specialty: string;
  @IsString() licenseNumber: string;
  @IsOptional() @IsString() biography?: string;
  @IsOptional() @IsString() color?: string;
}

@Controller('admin')
@UseGuards(ClerkAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  getStats() {
    return this.adminService.getStats();
  }

  @Get('users')
  getUsers() {
    return this.adminService.getUsers();
  }

  @Post('users/:clerkId/role')
  assignRole(@Param('clerkId') clerkId: string, @Body() dto: AssignRoleDto) {
    return this.adminService.assignRole(clerkId, dto.role);
  }

  @Get('doctors')
  getDoctors() {
    return this.adminService.getDoctors();
  }

  @Post('users/:userId/doctor-profile')
  createDoctorProfile(@Param('userId') userId: string, @Body() dto: CreateDoctorProfileDto) {
    return this.adminService.createDoctorProfile(userId, dto);
  }

  @Put('users/:userId/deactivate')
  deactivateUser(@Param('userId') userId: string) {
    return this.adminService.deactivateUser(userId);
  }

  @Delete('users/:userId')
  deleteUser(@Param('userId') userId: string) {
    return this.adminService.deleteUser(userId);
  }

  @Get('audit')
  getAuditLogs() {
    return this.adminService.getAuditLogs();
  }
}
