import { ApiProperty } from '@nestjs/swagger';
import { IsObject, IsNumber, IsOptional } from 'class-validator';
import { ProductCategory } from '../enums/product-category.enum';
import { VatCategory } from '../enums/vat-category.enum';

export class ColumnMappingDto {
  @ApiProperty({ required: false })
  @IsOptional()
  productName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  category?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  price?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  defaultQuantity?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  vatCategory?: string;
}

export class BulkUploadConfigDto {
  @ApiProperty()
  @IsObject()
  columnMapping: ColumnMappingDto;

  @ApiProperty()
  @IsObject()
  defaultValues: {
    category?: ProductCategory;
    vatCategory?: VatCategory;
    defaultQuantity?: number;
  };

  @ApiProperty({ required: false, default: 100 })
  @IsNumber()
  @IsOptional()
  batchSize?: number;
}
