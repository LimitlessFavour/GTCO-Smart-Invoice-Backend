import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsNotEmpty,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { ProductCategory } from '../enums/product-category.enum';
import { VatCategory } from '../enums/vat-category.enum';

export class CreateProductDto {
  @ApiProperty({
    description: 'Name of the product',
    example: 'iPhone 12',
  })
  @IsString()
  @IsNotEmpty()
  productName: string;

  @ApiProperty({
    description: 'Product description',
    example: 'Latest iPhone model with A14 Bionic chip',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Product category',
    enum: ProductCategory,
    example: ProductCategory.ELECTRONICS,
  })
  @IsEnum(ProductCategory)
  @IsNotEmpty()
  category: ProductCategory;

  @ApiProperty({
    description: 'Product price',
    example: 999.99,
  })
  @IsNumber()
  @IsNotEmpty()
  price: number;

  @ApiProperty({
    description: 'Default quantity',
    example: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  defaultQuantity: number;

  @ApiProperty({
    description: 'VAT category',
    enum: VatCategory,
    example: VatCategory.FIVE_PERCENT,
  })
  @IsEnum(VatCategory)
  @IsNotEmpty()
  vatCategory: VatCategory;

  @ApiProperty({
    description: 'Product image URL',
    required: false,
  })
  @IsString()
  @IsOptional()
  image?: string;
}
