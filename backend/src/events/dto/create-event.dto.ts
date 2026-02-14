import { IsDateString, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateEventDto {
  @IsString()
  @MinLength(3)
  title!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;
}
