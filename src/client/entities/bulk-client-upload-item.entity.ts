import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { BulkClientUploadJob } from './bulk-client-upload-job.entity';

export enum BulkClientUploadItemStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
}

@Entity('bulk_client_upload_items')
export class BulkClientUploadItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  jobId: string;

  @ManyToOne(() => BulkClientUploadJob, (job) => job.items)
  job: BulkClientUploadJob;

  @Column()
  rowNumber: number;

  @Column({
    type: 'enum',
    enum: BulkClientUploadItemStatus,
    default: BulkClientUploadItemStatus.PENDING,
  })
  status: BulkClientUploadItemStatus;

  @Column({ type: 'text', nullable: true })
  errorMessage?: string;

  @Column({ type: 'jsonb' })
  rawData: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  processedData?: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}
