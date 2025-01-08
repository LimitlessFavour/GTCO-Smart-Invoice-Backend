/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Injectable,
  NotFoundException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class ProductService {
  private readonly logger = new Logger(ProductService.name);

  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    private readonly storageService: StorageService,
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
    let imageUrl: string | undefined;

    if (image) {
      try {
        imageUrl = await this.storageService.uploadFile(
          image,
          'product-images',
          `${companyId}`,
        );
      } catch (uploadError) {
        this.logger.error(
          `Failed to upload product image for company ${companyId}`,
          uploadError?.stack || 'No stack trace',
          'create',
        );
        throw new BadRequestException({
          message: 'Failed to upload product image: ' + uploadError.message,
          statusCode: 400,
        });
      }
    }

    const sku = this.generateSKU(createProductDto.productName, companyId);
    const product = this.productRepository.create({
      ...createProductDto,
      sku,
      companyId,
      image: imageUrl,
    });
    return this.productRepository.save(product);
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
