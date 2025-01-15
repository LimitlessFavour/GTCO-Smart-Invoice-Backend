import { ApiProperty } from '@nestjs/swagger';

export class DeleteClientResponseDto {
  @ApiProperty({
    example: 'Client deleted successfully',
    description: 'Success message',
  })
  message: string;

  @ApiProperty({
    example: 200,
    description: 'HTTP status code',
  })
  statusCode: number;
}
