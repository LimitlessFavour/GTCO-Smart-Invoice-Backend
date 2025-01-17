import { ApiProperty } from '@nestjs/swagger';

export class InvoiceStatsDto {
  @ApiProperty({
    example: 50000,
    description: 'Total amount for overdue invoices',
  })
  overdue_amount: number;

  @ApiProperty({
    example: 25000,
    description: 'Total amount for drafted invoices',
  })
  total_drafted_amount: number;

  @ApiProperty({
    example: 3.5,
    description: 'Average time (in days) customers take to make payments',
  })
  average_paid_time: number;

  @ApiProperty({
    example: 75000,
    description: 'Total amount for unpaid invoices',
  })
  unpaid_total: number;

  @ApiProperty({
    example: 5,
    description: 'Number of invoices sent out today',
  })
  total_invoices_sent_today: number;
}
