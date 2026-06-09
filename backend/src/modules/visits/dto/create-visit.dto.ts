import { IsString, IsDateString, IsOptional } from 'class-validator';

export class CreateVisitDto {
  @IsString() appointmentId: string;
  @IsString() patientProfileId: string;
  @IsString() doctorProfileId: string;
  @IsDateString() visitDate: string;
  @IsOptional() @IsString() chiefComplaint?: string;
}

export class CreateReportDto {
  @IsOptional() @IsString() diagnosis?: string;
  @IsOptional() @IsString() treatment?: string;
  @IsOptional() @IsString() observations?: string;
  @IsOptional() @IsString() prescription?: string;
  @IsOptional() @IsString() followUpIn?: string;
}
