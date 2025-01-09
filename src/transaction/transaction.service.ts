import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Transaction } from './transaction.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { Company } from '../company/company.entity';
import { PaymentType } from './transaction.entity';

@Injectable()
export class TransactionService {
  constructor(
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    @InjectRepository(Company)
    private companyRepository: Repository<Company>,
  ) {}

  async create(
    createTransactionDto: CreateTransactionDto,
  ): Promise<Transaction> {
    const transaction = this.transactionRepository.create(createTransactionDto);

    // Update company revenue
    const company = await this.companyRepository.findOne({
      where: { id: createTransactionDto.companyId },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    // Update total revenue
    company.totalRevenue =
      (company.totalRevenue || 0) + createTransactionDto.amount;

    // Update withdrawable revenue only for gateway payments
    if (createTransactionDto.paymentType === PaymentType.GATEWAY) {
      company.withdrawableRevenue =
        (company.withdrawableRevenue || 0) + createTransactionDto.amount;
    }

    // Save both transaction and updated company revenue
    await Promise.all([
      this.companyRepository.save(company),
      this.transactionRepository.save(transaction),
    ]);

    return transaction;
  }

  async findByInvoiceId(invoiceId: number): Promise<Transaction[]> {
    return this.transactionRepository.find({
      where: { invoiceId },
      relations: ['invoice', 'client', 'company'],
    });
  }

  async findByCompany(
    companyId: number,
    startDate?: Date,
    endDate?: Date,
  ): Promise<Transaction[]> {
    const where: any = { companyId };

    if (startDate && endDate) {
      where.createdAt = Between(startDate, endDate);
    }

    return this.transactionRepository.find({
      where,
      relations: ['invoice', 'client', 'company'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByClient(clientId: number): Promise<Transaction[]> {
    return this.transactionRepository.find({
      where: { clientId },
      relations: ['invoice', 'client', 'company'],
      order: { createdAt: 'DESC' },
    });
  }

  async getCompanyRevenue(companyId: number) {
    const company = await this.companyRepository.findOne({
      where: { id: companyId },
    });
    return {
      totalRevenue: company.totalRevenue || 0,
      withdrawableRevenue: company.withdrawableRevenue || 0,
    };
  }

  async getClientPaymentTotals(companyId: number) {
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
      .getRawMany();
  }

  async getTopPayingClients(companyId: number, limit: number = 5) {
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

  async getRevenueByPaymentType(companyId: number) {
    return this.transactionRepository
      .createQueryBuilder('transaction')
      .select('transaction.paymentType', 'paymentType')
      .addSelect('SUM(transaction.amount)', 'total')
      .where('transaction.companyId = :companyId', { companyId })
      .groupBy('transaction.paymentType')
      .getRawMany();
  }
}
