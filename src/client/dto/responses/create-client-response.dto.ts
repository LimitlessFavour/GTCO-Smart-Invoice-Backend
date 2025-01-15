import { ApiProperty } from '@nestjs/swagger';

export class CreateClientResponseDto {
  @ApiProperty({
    example: 1,
    description: 'Unique identifier of the client',
  })
  id: number;

  @ApiProperty({
    example: 'John',
    description: 'First name of the client',
  })
  firstName: string;

  @ApiProperty({
    example: 'Snow',
    description: 'Last name of the client',
  })
  lastName: string;

  @ApiProperty({
    example: 'john.snow@example.com',
    description: 'Email address of the client',
  })
  email: string;

  @ApiProperty({
    example: '+2349012345678',
    description: 'Primary phone number of the client',
  })
  phoneNumber: string;

  @ApiProperty({
    example: 'No 3 Peaceville estate, Badore, Ajah, Lagos',
    description: 'Physical address of the client',
  })
  address: string;

  @ApiProperty({
    example: 1,
    description: 'ID of the company this client belongs to',
  })
  companyId: number;

  @ApiProperty({
    example: '2024-03-20T10:00:00Z',
    description: 'Date and time when the client was created',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2024-03-20T10:00:00Z',
    description: 'Date and time when the client was last updated',
  })
  updatedAt: Date;
}
