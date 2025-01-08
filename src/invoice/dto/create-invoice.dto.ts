import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsNumber,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { InvoiceItemDto } from './invoice-item.dto';

export class CreateInvoiceDto {
  @ApiProperty({ example: 33, description: 'ID of the client being billed' })
  @IsNumber()
  clientId: number;

  @ApiProperty({
    example: 3,
    description: 'ID of the company creating the invoice',
  })
  @IsNumber()
  companyId: number;

  @ApiProperty({
    example: '2025-01-08T09:52:29.830Z',
    description: 'Due date for the invoice payment',
  })
  @IsDateString()
  dueDate: Date;

  @ApiProperty({
    type: [InvoiceItemDto],
    example: [
      {
        productId: 35,
        quantity: 4,
      },
      {
        productId: 34,
        quantity: 2,
      },
    ],
    description: 'List of items to be included in the invoice',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceItemDto)
  items: InvoiceItemDto[];
}
