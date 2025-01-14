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
  INVOICE_FINALIZED = 'INVOICE_FINALIZED',
  CLIENT_CREATED = 'CLIENT_CREATED',
  CLIENT_UPDATED = 'CLIENT_UPDATED',
  PRODUCT_CREATED = 'PRODUCT_CREATED',
  PRODUCT_UPDATED = 'PRODUCT_UPDATED',
  USER_UPDATED = 'USER_UPDATED',
  USER_ONBOARDED = 'USER_ONBOARDED',
  COMPANY_CREATED = 'COMPANY_CREATED',
  SURVEY_CREATED = 'SURVEY_CREATED',
  SURVEY_UPDATED = 'SURVEY_UPDATED',
}

@Entity('activities')
export class Activity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: ActivityType,
    nullable: false,
  })
  type: ActivityType;

  @Column()
  entityType: string;

  @Column('text')
  entityId: string;

  @Column('text')
  companyId: string;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'companyId' })
  company: Company;

  @Column('jsonb', { nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}
