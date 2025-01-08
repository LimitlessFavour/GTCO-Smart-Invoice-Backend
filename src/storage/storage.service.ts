/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Injectable,
  InternalServerErrorException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private supabase;

  constructor(private configService: ConfigService) {
    this.supabase = createClient(
      this.configService.get<string>('SUPABASE_URL'),
      this.configService.get<string>('SUPABASE_SERVICE_KEY'),
    );
  }

  async uploadFile(
    file: Express.Multer.File,
    bucket: string,
    userId: string,
  ): Promise<string> {
    try {
      // Validate file
      if (!file.buffer || !file.mimetype) {
        throw new BadRequestException('Invalid file format');
      }

      // Log file details for debugging
      this.logger.debug(`Attempting to upload file:
        Original name: ${file.originalname}
        Size: ${file.size}
        Mime type: ${file.mimetype}
        Bucket: ${bucket}
      `);

      const timestamp = new Date().getTime();
      const fileExtension = file.originalname.split('.').pop();
      const fileName = `${userId}-${timestamp}.${fileExtension}`;

      const { data, error } = await this.supabase.storage
        .from(bucket)
        .upload(fileName, file.buffer, {
          contentType: file.mimetype,
          upsert: false,
        });

      if (error) {
        this.logger.error(
          `Supabase storage upload error: ${error.message}`,
          error.stack,
          'uploadFile',
        );
        throw new BadRequestException(`File upload failed: ${error.message}`);
      }

      const { data: urlData } = this.supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    } catch (error) {
      this.logger.error(
        'File upload failed',
        error?.stack || 'No stack trace',
        'uploadFile',
      );

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException({
        message: `File upload failed: ${error.message}`,
        statusCode: 400,
      });
    }
  }

  async deleteFile(bucket: string, filePath: string): Promise<void> {
    try {
      const { error } = await this.supabase.storage
        .from(bucket)
        .remove([filePath]);

      if (error) {
        throw new InternalServerErrorException({
          message: 'Failed to delete file: ' + error.message,
          statusCode: 500,
        });
      }
    } catch (error) {
      throw new InternalServerErrorException({
        message: 'Failed to delete file',
        statusCode: 500,
      });
    }
  }
}
