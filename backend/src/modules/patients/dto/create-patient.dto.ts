import { IsEmail, IsOptional, IsString, IsDateString, IsEnum, IsArray } from 'class-validator';

export enum Gender { MALE = 'MALE', FEMALE = 'FEMALE', OTHER = 'OTHER' }

export class CreatePatientDto {
  @IsString() firstName: string;
  @IsString() lastName: string;
  @IsEmail() email: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsDateString() dateOfBirth?: string;
  @IsOptional() @IsEnum(Gender) gender?: Gender;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsString() bloodType?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) allergies?: string[];
  @IsOptional() @IsString() medicalNotes?: string;
  @IsOptional() @IsString() emergencyContactName?: string;
  @IsOptional() @IsString() emergencyContactPhone?: string;
  @IsString() emiratesId: string;
}
