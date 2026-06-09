import { IsString, IsDateString, IsOptional, IsBoolean, IsEnum } from 'class-validator';
import { AppointmentStatus } from '@prisma/client';

export class UpdateAppointmentDto {
  @IsOptional() @IsDateString() startTime?: string;
  @IsOptional() @IsDateString() endTime?: string;
  @IsOptional() @IsString() reason?: string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsBoolean() isFirstVisit?: boolean;
  @IsOptional() @IsEnum(AppointmentStatus) status?: AppointmentStatus;
}
