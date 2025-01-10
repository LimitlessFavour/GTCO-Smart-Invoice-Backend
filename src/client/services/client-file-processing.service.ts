/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable, Logger } from '@nestjs/common';
import * as XLSX from 'xlsx';

@Injectable()
export class ClientFileProcessingService {
  private readonly logger = new Logger(ClientFileProcessingService.name);

  async validateAndParseFile(file: Express.Multer.File) {
    if (!file) {
      throw new Error('No file uploaded');
    }

    if (
      !file.mimetype.includes('csv') &&
      !file.mimetype.includes('spreadsheet')
    ) {
      throw new Error('Invalid file type. Please upload a CSV file');
    }

    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(firstSheet);

    return {
      totalRows: data.length,
      sampleData: data.slice(0, 5),
    };
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
        // Map the columns according to the provided mapping
        const mappedRow = {
          firstName:
            row.firstName || this.extractValue(row, columnMapping.firstName),
          lastName:
            row.lastName || this.extractValue(row, columnMapping.lastName),
          email: row.email || this.extractValue(row, columnMapping.email),
          phoneNumber:
            row.phoneNumber ||
            this.extractValue(row, columnMapping.phoneNumber),
          address: row.address || this.extractValue(row, columnMapping.address),
        };

        const processedRow = {
          ...mappedRow,
          ...defaultValues,
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
    if (!columnName) return null;
    return row[columnName];
  }

  private validateProcessedRow(row: any): void {
    if (!row.firstName) {
      throw new Error('First name is required');
    }
    if (!row.lastName) {
      throw new Error('Last name is required');
    }
    if (!row.email) {
      throw new Error('Email is required');
    }
    if (!row.phoneNumber) {
      throw new Error('Phone number is required');
    }
    if (!row.address) {
      throw new Error('Address is required');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(row.email)) {
      throw new Error('Invalid email format');
    }

    // Validate phone number (basic validation)
    const phoneRegex = /^\+?[0-9]{10,15}$/;
    if (!phoneRegex.test(row.phoneNumber.toString())) {
      throw new Error(
        'Invalid phone number format. Should be 10-15 digits, optionally starting with +',
      );
    }
  }
}
