import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { BulkUploadJob } from './bulk-upload-job.entity';

export enum BulkUploadProductStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
}

@Entity('bulk_upload_products')
export class BulkUploadProduct {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  jobId: string;

  @ManyToOne(() => BulkUploadJob, (job) => job.products)
  job: BulkUploadJob;

  @Column()
  rowNumber: number;

  @Column({
    type: 'enum',
    enum: BulkUploadProductStatus,
    default: BulkUploadProductStatus.PENDING,
  })
  status: BulkUploadProductStatus;

  @Column({ type: 'text', nullable: true })
  errorMessage?: string;

  @Column({ type: 'jsonb' })
  rawData: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  processedData?: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}
