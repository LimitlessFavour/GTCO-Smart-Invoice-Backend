import { ApiProperty } from '@nestjs/swagger';

export enum TimelineFilter {
  LAST_DAY = 'LAST_DAY',
  LAST_WEEK = 'LAST_WEEK',
  LAST_MONTH = 'LAST_MONTH',
  LAST_3_MONTHS = 'LAST_3_MONTHS',
  LAST_6_MONTHS = 'LAST_6_MONTHS',
  LAST_9_MONTHS = 'LAST_9_MONTHS',
  LAST_12_MONTHS = 'LAST_12_MONTHS',
}

export class PaymentsByMonth {
  @ApiProperty()
  month: string;

  @ApiProperty()
  amount: number;
}

export class TopClient {
  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty()
  totalPaid: number;
}

export class TopProduct {
  @ApiProperty()
  name: string;

  @ApiProperty()
  totalAmount: number;
}

export class InvoiceStats {
  @ApiProperty()
  totalInvoiced: number;

  @ApiProperty()
  paid: number;

  @ApiProperty()
  unpaid: number;

  @ApiProperty()
  drafted: number;
}

export class DashboardAnalyticsDto {
  @ApiProperty({ type: [PaymentsByMonth] })
  paymentsTimeline: PaymentsByMonth[];

  @ApiProperty()
  invoiceStats: InvoiceStats;

  @ApiProperty({ type: [TopClient] })
  topPayingClients: TopClient[];

  @ApiProperty({ type: [TopProduct] })
  topSellingProducts: TopProduct[];
}
