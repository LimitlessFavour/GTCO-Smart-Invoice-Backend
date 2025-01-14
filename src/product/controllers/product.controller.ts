import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  UseGuards,
  Logger,
  Req,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { ProductService } from '../services/product.service';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RequestContext } from '../../common/interfaces/request-context.interface';
import { FileInterceptor } from '@nestjs/platform-express';
import { VatCategory } from '../enums/vat-category.enum';
import { ProductCategory } from '../enums/product-category.enum';
import { ProductResponseDto } from '../dto/responses/product-response.dto';
import { ProductListResponseDto } from '../dto/responses/product-list-response.dto';

@ApiTags('Product')
@ApiBearerAuth()
@Controller('product')
@UseGuards(JwtAuthGuard)
export class ProductController {
  private readonly logger = new Logger(ProductController.name);

  constructor(private readonly productService: ProductService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new product' })
  @ApiResponse({
    status: 201,
    description: 'Product created successfully',
    type: ProductResponseDto,
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        productName: { type: 'string' },
        description: { type: 'string' },
        category: { type: 'string', enum: Object.values(ProductCategory) },
        price: { type: 'number' },
        defaultQuantity: { type: 'number' },
        vatCategory: { type: 'number', enum: Object.values(VatCategory) },
        image: {
          type: 'string',
          format: 'binary',
        },
      },
      required: ['productName', 'price', 'category', 'vatCategory'],
    },
  })
  @UseInterceptors(FileInterceptor('image'))
  async create(
    @Body() createProductDto: CreateProductDto,
    @Req() req: Request & { user: RequestContext['user'] },
    @UploadedFile() image?: Express.Multer.File,
  ): Promise<ProductResponseDto> {
    this.logger.debug(`Creating product: ${JSON.stringify(createProductDto)}`);
    return this.productService.create(
      createProductDto,
      req.user.company.id,
      image,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get all products' })
  @ApiResponse({
    status: 200,
    description: 'List of all products',
    type: ProductListResponseDto,
  })
  async findAll(
    @Req() req: Request & { user: RequestContext['user'] },
  ): Promise<ProductListResponseDto> {
    this.logger.debug(
      `Fetching all products for company: ${req.user.company.id}`,
    );
    const products = await this.productService.findAll(req.user.company.id);
    return { products };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a product by ID' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({
    status: 200,
    description: 'Product details',
    type: ProductResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async findOne(@Param('id') id: string): Promise<ProductResponseDto> {
    this.logger.debug(`Fetching product with ID: ${id}`);
    return this.productService.findOne(+id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a product' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({
    status: 200,
    description: 'Product updated successfully',
    type: ProductResponseDto,
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        productName: { type: 'string' },
        description: { type: 'string' },
        category: { type: 'string', enum: Object.values(ProductCategory) },
        price: { type: 'number' },
        defaultQuantity: { type: 'number' },
        vatCategory: { type: 'number', enum: Object.values(VatCategory) },
        image: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('image'))
  async update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @UploadedFile() image?: Express.Multer.File,
  ): Promise<ProductResponseDto> {
    this.logger.debug(
      `Updating product ${id}: ${JSON.stringify(updateProductDto)}`,
    );
    return this.productService.update(+id, updateProductDto, image);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a product' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({
    status: 200,
    description: 'Product deleted successfully',
    type: ProductResponseDto,
  })
  async remove(@Param('id') id: string): Promise<ProductResponseDto> {
    this.logger.debug(`Deleting product with ID: ${id}`);
    const product = await this.productService.findOne(+id);
    await this.productService.remove(+id);
    return product;
  }
}
