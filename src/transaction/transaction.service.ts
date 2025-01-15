import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Transaction } from './transaction.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { Company } from '../company/company.entity';
import { PaymentType } from './transaction.entity';
import { Logger } from '@nestjs/common';

@Injectable()
export class TransactionService {
  private readonly logger = new Logger(TransactionService.name);

  constructor(
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    @InjectRepository(Company)
    private companyRepository: Repository<Company>,
  ) {}

  async create(
    createTransactionDto: CreateTransactionDto,
  ): Promise<Transaction> {
    // Convert amount to number first, then format
    const amount = Number(createTransactionDto.amount);

    this.logger.debug('Creating transaction with data:', {
      ...createTransactionDto,
      amount,
      originalAmount: createTransactionDto.amount,
      amountType: typeof amount,
    });

    if (isNaN(amount)) {
      throw new Error(`Invalid amount value: ${createTransactionDto.amount}`);
    }

    const transaction = this.transactionRepository.create({
      ...createTransactionDto,
      amount: Number(amount.toFixed(2)),
    });

    // Update company revenue
    const company = await this.companyRepository.findOne({
      where: { id: createTransactionDto.companyId },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    // Update total revenue with proper number handling
    company.totalRevenue = Number(
      (Number(company.totalRevenue || 0) + amount).toFixed(2),
    );

    // Update withdrawable revenue only for gateway payments
    if (createTransactionDto.paymentType === PaymentType.GATEWAY) {
      company.withdrawableRevenue = Number(
        (Number(company.withdrawableRevenue || 0) + amount).toFixed(2),
      );
    }

    try {
      const [savedTransaction] = await Promise.all([
        this.transactionRepository.save(transaction),
        this.companyRepository.save(company),
      ]);

      return savedTransaction;
    } catch (error) {
      this.logger.error('Error saving transaction:', {
        error: error.message,
        stack: error.stack,
        transactionData: { ...createTransactionDto, amount },
      });
      throw error;
    }
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
