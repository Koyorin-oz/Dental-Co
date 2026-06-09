import { IsString, IsDateString, IsOptional, IsBoolean } from 'class-validator';

export class CreateAppointmentDto {
  @IsString() doctorProfileId: string;
  @IsString() patientProfileId: string;
  @IsDateString() startTime: string;
  @IsDateString() endTime: string;
  @IsOptional() @IsString() reason?: string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsBoolean() isFirstVisit?: boolean;
}
