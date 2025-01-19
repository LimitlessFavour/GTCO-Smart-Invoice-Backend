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
import {
  DraftInvoiceResponseDto,
  FinalizeDraftResponseDto,
  MarkAsPaidResponseDto,
} from './dto/response.dto';
import { ErrorResponseDto } from 'src/auth/dto/response.dto';

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
    return this.invoiceService.create(createInvoiceDto, true);
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
    return this.invoiceService.finalizeDraft(+id);
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
  async remove(@Param('id') id: string, @GetUser() user: User) {
    return this.invoiceService.remove(+id, user.company.id);
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
