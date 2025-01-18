/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Injectable,
  NotFoundException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../entities/product.entity';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { StorageService } from '../../storage/storage.service';
import { ActivityType } from 'src/activity/activity.entity';
import { ActivityService } from 'src/activity/activity.service';

@Injectable()
export class ProductService {
  private readonly logger = new Logger(ProductService.name);

  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    private readonly storageService: StorageService,
    private readonly activityService: ActivityService,
  ) {}

  private generateSKU(productName: string, companyId: number): string {
    const timestamp = Date.now().toString().slice(-4);
    const namePrefix = productName.slice(0, 3).toUpperCase();
    return `${namePrefix}-${companyId}-${timestamp}`;
  }

  async create(
    createProductDto: CreateProductDto,
    companyId: number,
    image?: Express.Multer.File,
  ): Promise<Product> {
    // Generate SKU first
    const timestamp = Date.now().toString().slice(-4);
    const namePrefix = createProductDto.productName.slice(0, 3).toUpperCase();
    const sku = `${namePrefix}-${companyId}-${timestamp}`;

    // Create the product with SKU
    const product = this.productRepository.create({
      ...createProductDto,
      companyId,
      sku,
    });

    if (image) {
      product.image = await this.storageService.uploadFile(
        image,
        'product-images',
        `${companyId}`,
      );
    }

    // Record activity and save product
    try {
      const savedProduct = await this.productRepository.save(product);
      await this.activityService.create({
        type: ActivityType.PRODUCT_CREATED,
        entityType: 'PRODUCT',
        entityId: savedProduct.id.toString(),
        companyId: companyId.toString(),
        metadata: {
          name: savedProduct.productName,
          sku: savedProduct.sku,
        },
      });

      return savedProduct;
    } catch (error) {
      this.logger.error(
        `Failed to create product: ${error.message}`,
        error?.stack,
        'create',
      );
      throw new BadRequestException({
        message: 'Failed to create product: ' + error.message,
        statusCode: 400,
      });
    }
  }

  async findAll(companyId: number): Promise<Product[]> {
    this.logger.debug(`Finding all products for company: ${companyId}`);
    return this.productRepository.find({
      where: { companyId },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async findOne(id: number): Promise<Product> {
    const product = await this.productRepository.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    return product;
  }

  async update(
    id: number,
    updateProductDto: UpdateProductDto,
    image?: Express.Multer.File,
  ): Promise<Product> {
    const product = await this.findOne(id);
    let imageUrl = product.image;

    if (image) {
      try {
        // Delete old image if it exists
        if (product.image) {
          try {
            // Extract bucket and filename from the URL
            const url = new URL(product.image);
            const pathParts = url.pathname.split('/');
            const bucket = pathParts[1]; // 'product-images'
            const fileName = pathParts[pathParts.length - 1];
            await this.storageService.deleteFile(bucket, fileName);
          } catch (urlError) {
            this.logger.warn(
              `Failed to parse old image URL: ${product.image}. Skipping delete operation.`,
              'update',
            );
            // Continue with upload even if delete fails
          }
        }

        // Upload new image
        imageUrl = await this.storageService.uploadFile(
          image,
          'product-images',
          `${product.companyId}`,
        );
      } catch (uploadError) {
        this.logger.error(
          `Failed to update product image for product ${id}`,
          uploadError?.stack || 'No stack trace',
          'update',
        );
        throw new BadRequestException({
          message: 'Failed to update product image: ' + uploadError.message,
          statusCode: 400,
        });
      }
    }

    // Filter out empty strings from updateProductDto
    const cleanedUpdateDto = Object.entries(updateProductDto).reduce(
      (acc, [key, value]) => {
        if (value !== '') {
          acc[key] = value;
        }
        return acc;
      },
      {} as UpdateProductDto,
    );

    Object.assign(product, cleanedUpdateDto, { image: imageUrl });
    return this.productRepository.save(product);
  }

  async remove(id: number): Promise<void> {
    const product = await this.findOne(id);
    await this.productRepository.remove(product);
  }
}
