import { ApiProperty } from '@nestjs/swagger';
import { InvoiceStatus } from '../enums/invoice-status.enum';

class InvoiceItemDto {
  @ApiProperty({
    example: 1,
    description: 'Unique identifier of the invoice item',
  })
  id: number;

  @ApiProperty({
    example: 'Website Development',
    description: 'Name of the product or service',
  })
  description: string;

  @ApiProperty({
    example: 2,
    description: 'Quantity of items',
  })
  quantity: number;

  @ApiProperty({
    example: 50000,
    description: 'Price per unit',
  })
  unitPrice: number;

  @ApiProperty({
    example: 100000,
    description: 'Total amount for this item',
  })
  amount: number;
}

export class CreateInvoiceResponseDto {
  @ApiProperty({
    example: 1,
    description: 'Unique identifier of the invoice',
  })
  id: number;

  @ApiProperty({
    example: 'INV-1234567890',
    description: 'Generated invoice number',
  })
  invoiceNumber: string;

  @ApiProperty({
    example: '2024-03-20',
    description: 'Due date for the invoice',
  })
  dueDate: Date;

  @ApiProperty({
    example: 150000,
    description: 'Total amount of the invoice',
  })
  totalAmount: number;

  @ApiProperty({
    enum: InvoiceStatus,
    example: InvoiceStatus.UNPAID,
    description: 'Current status of the invoice',
  })
  status: InvoiceStatus;

  @ApiProperty({
    type: [InvoiceItemDto],
    description: 'List of items in the invoice',
  })
  items: InvoiceItemDto[];

  @ApiProperty({
    example: {
      id: 1,
      firstName: 'John',
      lastName: 'Snow',
      email: 'john.snow@example.com',
    },
    description: 'Client information',
  })
  client: Record<string, any>;

  @ApiProperty({
    example: {
      id: 1,
      name: 'Company Name',
    },
    description: 'Company information',
  })
  company: Record<string, any>;
}

export class InvoiceListResponseDto {
  @ApiProperty({
    type: [CreateInvoiceResponseDto],
    description: 'List of invoices',
  })
  data: CreateInvoiceResponseDto[];

  @ApiProperty({
    example: 10,
    description: 'Total number of invoices',
  })
  total: number;

  @ApiProperty({
    example: 1,
    description: 'Current page number',
  })
  page: number;

  @ApiProperty({
    example: 10,
    description: 'Number of items per page',
  })
  limit: number;
}

export class MarkAsPaidResponseDto extends CreateInvoiceResponseDto {
  @ApiProperty({
    example: '2024-03-15T10:30:00Z',
    description: 'Date and time when the invoice was paid',
  })
  paidAt: Date;

  @ApiProperty({
    example: 'Payment received successfully',
    description: 'Success message',
  })
  message: string;
}

export class DraftInvoiceResponseDto extends CreateInvoiceResponseDto {
  @ApiProperty({
    example: InvoiceStatus.DRAFT,
    description: 'Status will always be DRAFT',
  })
  status: InvoiceStatus.DRAFT;
}

export class FinalizeDraftResponseDto extends CreateInvoiceResponseDto {
  @ApiProperty({
    example: InvoiceStatus.UNPAID,
    description: 'Status will be changed to UNPAID',
  })
  status: InvoiceStatus.UNPAID;

  @ApiProperty({
    example: 'https://payment.squad.co/xyz',
    description: 'Payment link generated for the invoice',
  })
  paymentLink: string;

  @ApiProperty({
    example: 'SQUAD-REF-123',
    description: 'Squad payment reference',
  })
  squadTransactionRef: string;
}

export class SingleInvoiceResponseDto extends CreateInvoiceResponseDto {
  @ApiProperty({
    example: '2024-03-15T10:30:00Z',
    description: 'Date when the invoice was created',
  })
  createdAt: Date;

  @ApiProperty({
    example: 'https://payment.squad.co/xyz',
    description: 'Payment link for the invoice',
    required: false,
  })
  paymentLink?: string;

  @ApiProperty({
    example: 'SQUAD-REF-123',
    description: 'Squad payment reference',
    required: false,
  })
  squadTransactionRef?: string;

  @ApiProperty({
    example: 'INV-REF-123',
    description: 'Internal transaction reference',
  })
  transactionRef: string;
}
