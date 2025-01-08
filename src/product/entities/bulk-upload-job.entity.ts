import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { Company } from '../../company/company.entity';
import { BulkUploadProduct } from './bulk-upload-product.entity';

export enum BulkUploadStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Entity('bulk_upload_jobs')
export class BulkUploadJob {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  companyId: number;

  @ManyToOne(() => Company)
  company: Company;

  @Column({
    type: 'enum',
    enum: BulkUploadStatus,
    default: BulkUploadStatus.PENDING,
  })
  status: BulkUploadStatus;

  @Column()
  totalRows: number;

  @Column({ default: 0 })
  processedRows: number;

  @Column({ default: 0 })
  successCount: number;

  @Column({ default: 0 })
  errorCount: number;

  @Column({ type: 'jsonb' })
  config: {
    columnMapping: Record<string, string>;
    defaultValues: Record<string, any>;
    batchSize: number;
  };

  @Column({ type: 'jsonb', nullable: true })
  errorLog?: Array<{
    row: number;
    message: string;
    data: any;
  }>;

  @OneToMany(() => BulkUploadProduct, (product) => product.job)
  products: BulkUploadProduct[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt?: Date;

  @Column({ type: 'bytea', nullable: true })
  file: Buffer;
}
