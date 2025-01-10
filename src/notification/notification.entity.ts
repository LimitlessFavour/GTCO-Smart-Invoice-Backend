import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Company } from '../company/company.entity';

export enum NotificationType {
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  INVOICE_OVERDUE = 'INVOICE_OVERDUE',
  CLIENT_CREATED = 'CLIENT_CREATED',
  PRODUCT_CREATED = 'PRODUCT_CREATED',
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: NotificationType,
  })
  type: NotificationType;

  @Column()
  title: string;

  @Column()
  message: string;

  @Column()
  companyId: number;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'companyId' })
  company: Company;

  @Column({ default: false })
  isRead: boolean;

  @Column('jsonb', { nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}
