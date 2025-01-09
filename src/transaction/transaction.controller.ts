import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TransactionService } from './transaction.service';
import { Transaction } from './transaction.entity';

@ApiTags('Transactions')
@Controller('transactions')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Get('company/:companyId')
  @ApiOperation({ summary: 'Get company transactions' })
  @ApiResponse({ status: 200, type: [Transaction] })
  async getCompanyTransactions(
    @Param('companyId') companyId: number,
    @Query('startDate') startDate?: Date,
    @Query('endDate') endDate?: Date,
  ) {
    return this.transactionService.findByCompany(companyId, startDate, endDate);
  }

  @Get('client/:clientId')
  @ApiOperation({ summary: 'Get client transactions' })
  @ApiResponse({ status: 200, type: [Transaction] })
  async getClientTransactions(@Param('clientId') clientId: number) {
    return this.transactionService.findByClient(clientId);
  }
}
