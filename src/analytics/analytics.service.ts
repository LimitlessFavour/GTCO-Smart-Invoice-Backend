/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Transaction } from '../transaction/transaction.entity';
import { Invoice } from '../invoice/invoice.entity';
import { Product } from '../product/entities/product.entity';
import {
  DashboardAnalyticsDto,
  TimelineFilter,
} from './dto/dashboard-analytics.dto';
import { InvoiceStatus } from '../invoice/enums/invoice-status.enum';
import {
  subDays,
  subWeeks,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfDay,
  endOfDay,
} from 'date-fns';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    @InjectRepository(Invoice)
    private invoiceRepository: Repository<Invoice>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) {}

  async getDashboardAnalytics(
    companyId: number,
    timeline: TimelineFilter = TimelineFilter.LAST_MONTH,
  ): Promise<DashboardAnalyticsDto> {
    const [startDate, endDate] = this.getTimelineDates(timeline);

    const [
      paymentsTimeline,
      invoiceStats,
      topPayingClients,
      topSellingProducts,
    ] = await Promise.all([
      this.getPaymentsTimeline(companyId, startDate, endDate),
      this.getInvoiceStats(companyId, startDate, endDate),
      this.getTopPayingClients(companyId),
      this.getTopSellingProducts(companyId),
    ]);

    return {
      paymentsTimeline,
      invoiceStats,
      topPayingClients,
      topSellingProducts,
    };
  }

  private getTimelineDates(timeline: TimelineFilter): [Date, Date] {
    const now = new Date();
    const endDate = endOfDay(now);

    switch (timeline) {
      case TimelineFilter.LAST_DAY:
        return [startOfDay(now), endDate];
      case TimelineFilter.LAST_WEEK:
        return [subWeeks(now, 1), endDate];
      case TimelineFilter.LAST_MONTH:
        return [subMonths(now, 1), endDate];
      case TimelineFilter.LAST_3_MONTHS:
        return [subMonths(now, 3), endDate];
      case TimelineFilter.LAST_6_MONTHS:
        return [subMonths(now, 6), endDate];
      case TimelineFilter.LAST_9_MONTHS:
        return [subMonths(now, 9), endDate];
      case TimelineFilter.LAST_12_MONTHS:
        return [subMonths(now, 12), endDate];
      default:
        return [subMonths(now, 1), endDate];
    }
  }

  private async getPaymentsTimeline(
    companyId: number,
    startDate: Date,
    endDate: Date,
  ) {
    return this.transactionRepository
      .createQueryBuilder('transaction')
      .select("DATE_TRUNC('day', transaction.createdAt)", 'month')
      .addSelect('SUM(transaction.amount)', 'amount')
      .where('transaction.companyId = :companyId', { companyId })
      .andWhere('transaction.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .groupBy('month')
      .orderBy('month', 'ASC')
      .getRawMany();
  }

  private async getInvoiceStats(
    companyId: number,
    startDate: Date,
    endDate: Date,
  ) {
    const invoices = await this.invoiceRepository
      .createQueryBuilder('invoice')
      .leftJoinAndSelect('invoice.company', 'company')
      .where('company.id = :companyId', { companyId })
      .andWhere('invoice.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .getMany();

    return {
      totalInvoiced: invoices.reduce((sum, inv) => sum + inv.totalAmount, 0),
      paid: invoices.filter((inv) => inv.status === InvoiceStatus.PAID).length,
      unpaid: invoices.filter((inv) => inv.status === InvoiceStatus.UNPAID)
        .length,
      drafted: invoices.filter((inv) => inv.status === InvoiceStatus.DRAFT)
        .length,
    };
  }

  private async getTopPayingClients(companyId: number, limit: number = 4) {
    return this.transactionRepository
      .createQueryBuilder('transaction')
      .select('client.firstName', 'firstName')
      .addSelect('client.lastName', 'lastName')
      .addSelect('SUM(transaction.amount)', 'totalPaid')
      .leftJoin('transaction.client', 'client')
      .where('transaction.companyId = :companyId', { companyId })
      .groupBy('client.id')
      .addGroupBy('client.firstName')
      .addGroupBy('client.lastName')
      .orderBy('totalPaid', 'DESC')
      .limit(limit)
      .getRawMany();
  }

  private async getTopSellingProducts(companyId: number, limit: number = 4) {
    return this.productRepository
      .createQueryBuilder('product')
      .select('product.name', 'name')
      .addSelect(
        'SUM(invoice_item.quantity * invoice_item.unitPrice)',
        'totalAmount',
      )
      .leftJoin('product.invoiceItems', 'invoice_item')
      .leftJoin('invoice_item.invoice', 'invoice')
      .where('product.companyId = :companyId', { companyId })
      .andWhere('invoice.status = :status', { status: 'PAID' })
      .groupBy('product.id')
      .orderBy('totalAmount', 'DESC')
      .limit(limit)
      .getRawMany();
  }
}
