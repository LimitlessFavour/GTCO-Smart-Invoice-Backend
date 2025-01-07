/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';

@Injectable()
export class StorageService {
  private supabase;

  constructor(private configService: ConfigService) {
    this.supabase = createClient(
      this.configService.get<string>('SUPABASE_URL'),
      this.configService.get<string>('SUPABASE_KEY'),
    );
  }

  async uploadFile(
    file: Express.Multer.File,
    bucket: string,
    userId: string,
  ): Promise<string> {
    try {
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
        throw new InternalServerErrorException({
          message: 'Failed to upload file: ' + error.message,
          statusCode: 500,
        });
      }

      const { data: urlData } = this.supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    } catch (error) {
      throw new InternalServerErrorException({
        message: 'Failed to upload file',
        statusCode: 500,
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
