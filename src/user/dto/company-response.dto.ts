import { ApiProperty } from '@nestjs/swagger';

export class CompanyResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  description: string;

  @ApiProperty({ required: false })
  logo?: string;

  @ApiProperty()
  totalRevenue: number;

  @ApiProperty()
  withdrawableRevenue: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
