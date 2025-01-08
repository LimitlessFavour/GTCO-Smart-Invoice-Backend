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
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequestContext } from '../common/interfaces/request-context.interface';
import { FileInterceptor } from '@nestjs/platform-express';
import { VatCategory } from './enums/vat-category.enum';
import { ProductCategory } from './enums/product-category.enum';

@ApiTags('Product')
@ApiBearerAuth()
@Controller('product')
@UseGuards(JwtAuthGuard)
export class ProductController {
  private readonly logger = new Logger(ProductController.name);

  constructor(private readonly productService: ProductService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new product' })
  @ApiResponse({ status: 201, description: 'Product created successfully' })
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
  ) {
    this.logger.debug(`Creating product: ${JSON.stringify(createProductDto)}`);
    return this.productService.create(
      createProductDto,
      req.user.company.id,
      image,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get all products' })
  @ApiResponse({ status: 200, description: 'List of all products' })
  async findAll(@Req() req: Request & { user: RequestContext['user'] }) {
    this.logger.debug(
      `Fetching all products for company: ${req.user.company.id}`,
    );
    return this.productService.findAll(req.user.company.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a product by ID' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({ status: 200, description: 'Product details' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async findOne(@Param('id') id: string) {
    this.logger.debug(`Fetching product with ID: ${id}`);
    return this.productService.findOne(+id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a product' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({ status: 200, description: 'Product updated successfully' })
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
  ) {
    this.logger.debug(
      `Updating product ${id}: ${JSON.stringify(updateProductDto)}`,
    );
    return this.productService.update(+id, updateProductDto, image);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a product' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({ status: 200, description: 'Product deleted successfully' })
  async remove(@Param('id') id: string) {
    this.logger.debug(`Deleting product with ID: ${id}`);
    return this.productService.remove(+id);
  }
}
