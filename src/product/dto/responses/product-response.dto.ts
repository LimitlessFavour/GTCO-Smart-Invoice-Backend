import { ApiProperty } from '@nestjs/swagger';
import { ProductCategory } from '../../enums/product-category.enum';
import { VatCategory } from '../../enums/vat-category.enum';

export class ProductResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'iPhone 12' })
  productName: string;

  @ApiProperty({ example: 'Latest iPhone model with A14 Bionic chip' })
  description: string;

  @ApiProperty({ enum: ProductCategory, example: ProductCategory.ELECTRONICS })
  category: ProductCategory;

  @ApiProperty({ example: 999.99 })
  price: number;

  @ApiProperty({ example: 1 })
  defaultQuantity: number;

  @ApiProperty({
    enum: VatCategory,
    example: VatCategory.FIVE_PERCENT,
    type: 'number',
  })
  vatCategory: VatCategory;

  @ApiProperty({ example: 'IPH-1-1234' })
  sku: string;

  @ApiProperty({ example: 'https://example.com/images/iphone12.jpg' })
  image: string;

  @ApiProperty({ example: 1 })
  companyId: number;

  @ApiProperty({ example: '2024-01-14T08:25:00.923Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-14T08:25:00.923Z' })
  updatedAt: Date;
}
