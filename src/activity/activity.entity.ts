import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Company } from '../company/company.entity';

export enum ActivityType {
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  PAYMENT_MARKED_MANUAL = 'PAYMENT_MARKED_MANUAL',
  INVOICE_MARKED_OVERDUE = 'INVOICE_MARKED_OVERDUE',
  INVOICE_CREATED = 'INVOICE_CREATED',
  INVOICE_UPDATED = 'INVOICE_UPDATED',
  CLIENT_CREATED = 'CLIENT_CREATED',
  PRODUCT_CREATED = 'PRODUCT_CREATED',
}

@Entity('activities')
export class Activity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: ActivityType,
  })
  type: ActivityType;

  @Column()
  entityType: string;

  @Column()
  entityId: number;

  @Column()
  companyId: number;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'companyId' })
  company: Company;

  @Column('jsonb', { nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}
