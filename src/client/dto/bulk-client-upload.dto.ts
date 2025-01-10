import { ApiProperty } from '@nestjs/swagger';
import { IsObject, IsNumber, IsOptional } from 'class-validator';

export class ClientColumnMappingDto {
  @ApiProperty({ required: false })
  @IsOptional()
  firstName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  lastName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  email?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  phoneNumber?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  address?: string;
}

export class BulkClientUploadConfigDto {
  @ApiProperty()
  @IsObject()
  columnMapping: ClientColumnMappingDto;

  @ApiProperty()
  @IsObject()
  defaultValues: Record<string, any>;

  @ApiProperty({ required: false, default: 100 })
  @IsNumber()
  @IsOptional()
  batchSize?: number;
}
