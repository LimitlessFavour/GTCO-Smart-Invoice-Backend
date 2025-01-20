import { ApiProperty } from '@nestjs/swagger';
import { Transaction } from '../../transaction/transaction.entity';

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

export class InvoicesTimeline {
  @ApiProperty()
  month: string;

  @ApiProperty()
  count: number;

  @ApiProperty()
  amount: number;
}

export class ActivityItem {
  @ApiProperty()
  id: number;

  @ApiProperty()
  activity: string;

  @ApiProperty()
  entityType: string;

  @ApiProperty()
  entityId: string;

  @ApiProperty()
  metadata: Record<string, any>;

  @ApiProperty()
  date: string;
}

export class DashboardAnalyticsDto {
  @ApiProperty({ type: [Transaction] })
  paymentsTimeline: Transaction[];

  @ApiProperty({ type: [InvoicesTimeline] })
  invoicesTimeline: InvoicesTimeline[];

  @ApiProperty()
  invoiceStats: InvoiceStats;

  @ApiProperty({ type: [TopClient] })
  topPayingClients: TopClient[];

  @ApiProperty({ type: [TopProduct] })
  topSellingProducts: TopProduct[];

  @ApiProperty({ type: [ActivityItem] })
  activities: ActivityItem[];
}
