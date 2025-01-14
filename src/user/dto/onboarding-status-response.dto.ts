import { ApiProperty } from '@nestjs/swagger';

export class OnboardingStatusResponseDto {
  @ApiProperty()
  step: number;

  @ApiProperty()
  completed: boolean;
}
