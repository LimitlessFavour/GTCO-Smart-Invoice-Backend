/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  HttpStatus,
  Req,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { InvoiceService } from './invoice.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequestContext } from '../common/interfaces/request-context.interface';
import { AuthGuard } from '@nestjs/passport';
import { CompanyContextGuard } from 'src/common/guards/company-context.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '../user/user.entity';

@ApiTags('Invoice')
@ApiBearerAuth()
@Controller('invoice')
@UseGuards(JwtAuthGuard)
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new invoice' })
  async create(@Body() createInvoiceDto: CreateInvoiceDto) {
    return this.invoiceService.create(createInvoiceDto, false);
  }

  @Get()
  @ApiOperation({ summary: 'Get all invoices for current company' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of all invoices',
  })
  async findAll(@Req() req: Request & { user: RequestContext['user'] }) {
    if (!req.user?.company?.id) {
      throw new BadRequestException('Company ID is required');
    }
    return this.invoiceService.findAll(req.user.company.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an invoice by ID' })
  async findOne(@Param('id') id: string) {
    return this.invoiceService.findOne(+id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an invoice' })
  async update(
    @Param('id') id: string,
    @Body() updateInvoiceDto: UpdateInvoiceDto,
    @GetUser() user: User,
  ) {
    return this.invoiceService.update(+id, updateInvoiceDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an invoice' })
  async remove(@Param('id') id: string, @GetUser() user: User) {
    return this.invoiceService.remove(+id, user.company.id);
  }

  @Post(':id/mark-paid')
  @ApiOperation({ summary: 'Mark invoice as paid manually' })
  async markAsPaid(@Param('id') id: string) {
    return this.invoiceService.markAsPaid(+id, false);
  }
}
