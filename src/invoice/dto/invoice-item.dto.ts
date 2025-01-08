import { IsNumber, IsPositive, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class InvoiceItemDto {
  @ApiProperty({
    example: 35,
    description: 'ID of the product being invoiced',
  })
  @IsNumber()
  @IsPositive()
  productId: number;

  @ApiProperty({
    example: 4,
    description: 'Quantity of the product',
    minimum: 1,
    maximum: 999999,
  })
  @IsNumber()
  @IsPositive()
  @Min(1, { message: 'Quantity must be at least 1' })
  @Max(999999, { message: 'Quantity cannot exceed 999,999' })
  quantity: number;
}
