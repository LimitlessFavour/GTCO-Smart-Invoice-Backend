import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SurveyResponseDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  source: string; // Where they heard about the service
}
