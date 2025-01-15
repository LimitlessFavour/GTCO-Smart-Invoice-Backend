import { ApiProperty } from '@nestjs/swagger';
import { CreateClientResponseDto } from './create-client-response.dto';

export class UpdateClientResponseDto {
  @ApiProperty({
    type: CreateClientResponseDto,
    description: 'Updated client information',
  })
  client: CreateClientResponseDto;

  @ApiProperty({
    example: 'Client updated successfully',
    description: 'Success message',
  })
  message: string;
}
