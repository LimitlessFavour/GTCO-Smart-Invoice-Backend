import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class OnboardCompanyDto {
  @ApiProperty({ type: 'string', format: 'text' })
  @IsString()
  @IsNotEmpty()
  companyName: string;

  @ApiProperty({ type: 'string', format: 'text' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ type: 'string', format: 'binary', required: false })
  logo?: any;
}
