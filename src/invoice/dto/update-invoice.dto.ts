import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsDate, IsNumber } from 'class-validator';

export class UpdateInvoiceDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  invoiceNumber?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDate()
  dueDate?: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  companyId?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  clientId?: number;
}
