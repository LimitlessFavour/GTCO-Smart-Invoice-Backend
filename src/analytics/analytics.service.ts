/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Transaction } from '../transaction/transaction.entity';
import { Invoice } from '../invoice/invoice.entity';
import { Product } from '../product/entities/product.entity';
import { Activity } from '../activity/activity.entity';
import {
  endOfDay,
  startOfDay,
  subDays,
  subWeeks,
  subMonths,
  addDays,
  addWeeks,
  addMonths,
  format,
  differenceInDays,
} from 'date-fns';
import {
  DashboardAnalyticsDto,
  TimelineFilter,
  InvoiceStats,
  PaymentsByMonth,
  TopClient,
  TopProduct,
  InvoicesTimeline,
  ActivityItem,
} from './dto/dashboard-analytics.dto';
import { InvoiceStatus } from '../invoice/enums/invoice-status.enum';
// import { ActivityItem } from './dto/activity-item.dto';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    @InjectRepository(Invoice)
    private invoiceRepository: Repository<Invoice>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(Activity)
    private activityRepository: Repository<Activity>,
    private readonly logger: Logger,
  ) {}

  private getTimelineDates(timeline: TimelineFilter): [Date, Date] {
    const now = new Date();
    const endDate = endOfDay(now);
    let startDate: Date;

    switch (timeline) {
      case TimelineFilter.LAST_DAY:
        startDate = subDays(now, 1);
        break;
      case TimelineFilter.LAST_WEEK:
        startDate = subWeeks(now, 1);
        break;
      case TimelineFilter.LAST_MONTH:
        startDate = subMonths(now, 1);
        break;
      case TimelineFilter.LAST_3_MONTHS:
        startDate = subMonths(now, 3);
        break;
      case TimelineFilter.LAST_6_MONTHS:
        startDate = subMonths(now, 6);
        break;
      case TimelineFilter.LAST_9_MONTHS:
        startDate = subMonths(now, 9);
        break;
      case TimelineFilter.LAST_12_MONTHS:
        startDate = subMonths(now, 12);
        break;
      default:
        startDate = subMonths(now, 1);
    }

    return [startOfDay(startDate), endDate];
  }

  private async getPaymentsTimeline(
    companyId: number,
    startDate: Date,
    endDate: Date,
  ): Promise<Transaction[]> {
    return (
      this.transactionRepository
        .createQueryBuilder('transaction')
        .where('transaction.company.id = :companyId', { companyId })
        .andWhere('transaction.createdAt BETWEEN :startDate AND :endDate', {
          startDate,
          endDate,
        })
        // .leftJoinAndSelect('transaction.client', 'client')
        // .leftJoinAndSelect('transaction.invoice', 'invoice')
        .orderBy('transaction.createdAt', 'DESC')
        .getMany()
    );
  }

  private fillMissingPeriods(
    data: any[],
    startDate: Date,
    endDate: Date,
    timeFormat: string,
  ): PaymentsByMonth[] {
    const filledData: PaymentsByMonth[] = [];
    let currentDate = startDate;

    while (currentDate <= endDate) {
      const existingData = data.find(
        (d) =>
          format(new Date(d.month), 'yyyy-MM-dd') ===
          format(currentDate, 'yyyy-MM-dd'),
      );

      filledData.push({
        month: format(currentDate, this.getDateFormat(timeFormat)),
        amount: existingData ? Number(existingData.amount) : 0,
      });

      // Increment the date based on the time format
      switch (timeFormat) {
        case 'day':
          currentDate = addDays(currentDate, 1);
          break;
        case 'week':
          currentDate = addWeeks(currentDate, 1);
          break;
        default:
          currentDate = addMonths(currentDate, 1);
      }
    }

    return filledData;
  }

  private getDateFormat(timeFormat: string): string {
    switch (timeFormat) {
      case 'day':
        return 'MMM dd';
      case 'week':
        return "'Week' w, MMM";
      default:
        return 'MMM yyyy';
    }
  }

  private async getInvoiceStats(companyId: number): Promise<InvoiceStats> {
    const invoices = await this.invoiceRepository.find({
      where: { company: { id: companyId } },
      relations: ['company'],
    });

    const stats = {
      totalInvoiced: 0,
      paid: 0,
      unpaid: 0,
      drafted: 0,
    };

    invoices.forEach((invoice) => {
      const amount = Number(invoice.totalAmount);
      stats.totalInvoiced += amount;

      switch (invoice.status) {
        case InvoiceStatus.PAID:
          stats.paid += amount;
          break;
        case InvoiceStatus.UNPAID:
        case InvoiceStatus.OVERDUE:
          stats.unpaid += amount;
          break;
        case InvoiceStatus.DRAFT:
          stats.drafted += amount;
          break;
      }
    });

    return stats;
  }

  private async getTopPayingClients(companyId: number) {
    return this.transactionRepository
      .createQueryBuilder('transaction')
      .select('client.firstName', 'firstName')
      .addSelect('client.lastName', 'lastName')
      .addSelect('SUM(transaction.amount)', 'totalPaid')
      .leftJoin('transaction.client', 'client')
      .where('transaction.company.id = :companyId', { companyId })
      .groupBy('client.id')
      .addGroupBy('client.firstName')
      .addGroupBy('client.lastName')
      .orderBy('SUM(transaction.amount)', 'DESC')
      .limit(5)
      .getRawMany();
  }

  private async getTopSellingProducts(companyId: number) {
    return this.productRepository
      .createQueryBuilder('product')
      .select('product.productName', 'name')
      .addSelect(
        'SUM(invoice_item.quantity * invoice_item.price)',
        'totalAmount',
      )
      .leftJoin('product.invoiceItems', 'invoice_item')
      .leftJoin('invoice_item.invoice', 'invoice')
      .where('product.companyId = :companyId', { companyId })
      .andWhere('invoice.status = :status', { status: InvoiceStatus.PAID })
      .groupBy('product.id')
      .addGroupBy('product.productName')
      .orderBy('SUM(invoice_item.quantity * invoice_item.price)', 'DESC')
      .limit(4)
      .getRawMany();
  }

  private async getLast20Activities(
    companyId: string,
  ): Promise<ActivityItem[]> {
    const activities = await this.activityRepository.find({
      where: { companyId },
      order: { createdAt: 'DESC' },
      take: 20,
      relations: ['company'],
    });

    return activities.map((activity) => ({
      id: activity.id,
      activity: activity.type,
      entityType: activity.entityType,
      entityId: activity.entityId,
      metadata: activity.metadata,
      date: format(activity.createdAt, 'MMM dd, yyyy HH:mm'),
    }));
  }

  async getDashboardAnalytics(
    companyId: number,
    paymentsTimeline: TimelineFilter = TimelineFilter.LAST_MONTH,
    invoicesTimeline: TimelineFilter = TimelineFilter.LAST_MONTH,
  ): Promise<DashboardAnalyticsDto> {
    try {
      const [paymentsStartDate, paymentsEndDate] =
        this.getTimelineDates(paymentsTimeline);
      const [invoicesStartDate, invoicesEndDate] =
        this.getTimelineDates(invoicesTimeline);

      const [
        paymentsData,
        invoiceStats,
        topPayingClients,
        topSellingProducts,
        activities,
      ] = await Promise.all([
        this.getPaymentsTimeline(companyId, paymentsStartDate, paymentsEndDate),
        this.getInvoiceStats(companyId),
        this.getTopPayingClients(companyId),
        this.getTopSellingProducts(companyId),
        this.getLast20Activities(String(companyId)),
      ]);

      return {
        paymentsTimeline: paymentsData,
        invoicesTimeline: [], // TODO: Implement getInvoicesTimeline
        invoiceStats,
        topPayingClients,
        topSellingProducts,
        activities,
      };
    } catch (error) {
      this.logger.error('Error fetching dashboard analytics:', error);
      throw new InternalServerErrorException(
        'Failed to fetch dashboard analytics',
      );
    }
  }
}
