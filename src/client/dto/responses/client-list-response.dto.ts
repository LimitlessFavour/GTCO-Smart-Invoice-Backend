import { ApiProperty } from '@nestjs/swagger';
import { CreateClientResponseDto } from './create-client-response.dto';

export class ClientListResponseDto {
  @ApiProperty({
    type: [CreateClientResponseDto],
    description: 'List of clients',
  })
  data: CreateClientResponseDto[];

  @ApiProperty({
    example: 10,
    description: 'Total number of clients',
  })
  total: number;
}
