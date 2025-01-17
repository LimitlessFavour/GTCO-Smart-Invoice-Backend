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
} from '@nestjs/common';
import { InvoiceService } from './invoice.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import {
  CreateInvoiceResponseDto,
  InvoiceListResponseDto,
  MarkAsPaidResponseDto,
  DraftInvoiceResponseDto,
  FinalizeDraftResponseDto,
  SingleInvoiceResponseDto,
} from './dto/response.dto';
import { ErrorResponseDto } from 'src/auth/dto/response.dto';
import { User } from 'src/user/user.entity';

@ApiTags('Invoice')
@Controller('invoice')
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new invoice' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Invoice created successfully',
    type: CreateInvoiceResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error',
  })
  async create(@Body() createInvoiceDto: CreateInvoiceDto, @Req() request) {
    const user: User = request.user;
    return this.invoiceService.create(createInvoiceDto, false, user);
  }

  @Post('draft')
  @ApiOperation({ summary: 'Create a new draft invoice' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Draft invoice created successfully',
    type: DraftInvoiceResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error',
  })
  async createDraft(
    @Body() createInvoiceDto: CreateInvoiceDto,
    @Req() request,
  ) {
    const user: User = request.user;
    return this.invoiceService.create(createInvoiceDto, true, user);
  }

  @Post('draft/:id/finalize')
  @ApiOperation({ summary: 'Finalize a draft invoice' })
  @ApiParam({ name: 'id', description: 'Invoice ID', type: 'number' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Invoice finalized successfully',
    type: FinalizeDraftResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Invoice not found',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invoice is not in draft status',
    type: ErrorResponseDto,
  })
  async finalizeDraft(@Param('id') id: string, @Req() request) {
    const user: User = request.user;
    return this.invoiceService.finalizeDraft(+id, user);
  }

  @Get()
  @ApiOperation({ summary: 'Get all invoices' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of all invoices',
    type: InvoiceListResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error',
    type: ErrorResponseDto,
  })
  async findAll() {
    return this.invoiceService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an invoice by ID' })
  @ApiParam({ name: 'id', description: 'Invoice ID', type: 'number' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Invoice details',
    type: SingleInvoiceResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Invoice not found',
    type: ErrorResponseDto,
  })
  async findOne(@Param('id') id: string) {
    return this.invoiceService.findOne(+id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an invoice' })
  @ApiParam({ name: 'id', description: 'Invoice ID', type: 'number' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Invoice updated successfully',
    type: SingleInvoiceResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Invoice not found',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data or invoice not in draft status',
    type: ErrorResponseDto,
  })
  async update(
    @Param('id') id: string,
    @Body() updateInvoiceDto: UpdateInvoiceDto,
  ) {
    return this.invoiceService.update(+id, updateInvoiceDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an invoice' })
  @ApiParam({ name: 'id', description: 'Invoice ID', type: 'number' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Invoice deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Invoice not found',
  })
  async remove(@Param('id') id: string) {
    return this.invoiceService.remove(+id);
  }

  @Post(':id/mark-paid')
  @ApiOperation({ summary: 'Mark invoice as paid manually' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Invoice marked as paid successfully',
    type: MarkAsPaidResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Invoice not found',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invoice already paid',
    type: ErrorResponseDto,
  })
  async markAsPaid(@Param('id') id: string) {
    return this.invoiceService.markAsPaid(+id, false);
  }
}
