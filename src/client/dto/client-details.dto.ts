import { ApiProperty } from '@nestjs/swagger';
import { Invoice } from '../../invoice/invoice.entity';
import { Client } from '../client.entity';

export class ClientDetailsDto {
  @ApiProperty({
    description: 'Unique identifier of the client',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'First name of the client',
    example: 'John',
  })
  firstName: string;

  @ApiProperty({
    description: 'Last name of the client',
    example: 'Snow',
  })
  lastName: string;

  @ApiProperty({
    description: 'Email address of the client',
    example: 'john.snow@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'Primary phone number of the client',
    example: '+2349012345678',
  })
  phoneNumber: string;

  @ApiProperty({
    description: 'Alternative mobile number of the client',
    example: '+2348012345678',
  })
  mobileNumber: string;

  @ApiProperty({
    description: 'Physical address of the client',
    example: 'No 3 Peaceville estate, Badore, Ajah, Lagos',
  })
  address: string;

  @ApiProperty({
    description: 'Total amount from overdue invoices',
    example: 150000,
  })
  totalOverdueAmount: number;

  @ApiProperty({
    description: 'Total amount from drafted invoices',
    example: 50000,
  })
  totalDraftedAmount: number;

  @ApiProperty({
    description: 'Total amount paid by the client',
    example: 500000,
  })
  totalPaidAmount: number;

  @ApiProperty({
    description: 'List of all invoices associated with the client',
    type: [Invoice],
  })
  invoices: Invoice[];

  constructor(client: Client) {
    Object.assign(this, client);
  }
}
