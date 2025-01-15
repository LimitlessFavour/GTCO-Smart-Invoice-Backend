import { ApiProperty } from '@nestjs/swagger';

export class SurveyResponseOutputDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  source: string;

  @ApiProperty()
  createdAt: Date;
}
