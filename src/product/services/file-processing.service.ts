import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import * as XLSX from 'xlsx';
import { ProductCategory } from '../enums/product-category.enum';
import { VatCategory } from '../enums/vat-category.enum';

@Injectable()
export class FileProcessingService {
  private readonly logger = new Logger(FileProcessingService.name);
  private readonly categoryMapping = {
    FURNITURE: ProductCategory.HOME_FURNITURE,
    ELECTRONICS: ProductCategory.ELECTRONICS,
    STATIONERY: ProductCategory.BOOKS,
    OFFICE_SUPPLIES: ProductCategory.ELECTRONICS,
    OTHER: ProductCategory.OTHER,
  };

  private readonly vatCategoryMapping = {
    FIVE_PERCENT: VatCategory.FIVE_PERCENT,
    SEVEN_POINT_FIVE_PERCENT: VatCategory.SEVEN_POINT_FIVE_PERCENT,
    ZERO_PERCENT: VatCategory.ZERO_PERCENT,
  };

  async validateAndParseFile(file: Express.Multer.File): Promise<{
    headers: string[];
    sampleData: any[];
    totalRows: number;
  }> {
    try {
      if (!file.buffer) {
        throw new BadRequestException('Invalid file: Empty buffer');
      }

      const workbook = XLSX.read(file.buffer, { type: 'buffer' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(firstSheet);

      if (!data.length) {
        throw new BadRequestException('File is empty');
      }

      const headers = Object.keys(data[0]);
      const sampleData = data.slice(0, 5);

      return {
        headers,
        sampleData,
        totalRows: data.length,
      };
    } catch (error) {
      this.logger.error(
        'File processing failed',
        error?.stack || 'No stack trace',
        'validateAndParseFile',
      );
      throw new BadRequestException(`File processing failed: ${error.message}`);
    }
  }

  async processFileData(
    fileBuffer: Buffer,
    columnMapping: Record<string, string>,
    defaultValues: Record<string, any>,
  ): Promise<any[]> {
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawData = XLSX.utils.sheet_to_json(firstSheet, { raw: true });

    return rawData.map((row: any, index: number) => {
      try {
        const category =
          this.categoryMapping[row.category] || defaultValues.category;
        const vatCategory =
          this.vatCategoryMapping[row.vatCategory] || defaultValues.vatCategory;

        const processedRow = {
          productName: row.productName,
          description: row.description,
          category: category,
          price: Number(row.price),
          defaultQuantity:
            Number(row.defaultQuantity) || defaultValues.defaultQuantity,
          vatCategory: vatCategory,
          rowNumber: index + 1,
          rawData: row,
        };

        this.validateProcessedRow(processedRow);
        return processedRow;
      } catch (error) {
        return {
          rowNumber: index + 1,
          error: error.message,
          rawData: row,
        };
      }
    });
  }

  private extractValue(row: any, columnName: string): any {
    if (row[columnName] !== undefined) {
      return row[columnName];
    }
    return null;
  }

  private validateProcessedRow(row: any): void {
    if (!row.productName) {
      throw new Error('Product name is required');
    }
    if (!row.description) {
      throw new Error('Description is required');
    }
    if (!row.category) {
      throw new Error('Category is required');
    }
    if (!row.price || isNaN(Number(row.price))) {
      throw new Error('Valid price is required');
    }
    if (!row.defaultQuantity || isNaN(Number(row.defaultQuantity))) {
      throw new Error('Valid default quantity is required');
    }
    if (!row.vatCategory) {
      throw new Error('VAT category is required');
    }
  }
}
