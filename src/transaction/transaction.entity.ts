import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Invoice } from '../invoice/invoice.entity';
import { Client } from '../client/client.entity';
import { Company } from '../company/company.entity';

export enum PaymentType {
  GATEWAY = 'GATEWAY',
  MANUAL = 'MANUAL',
}

@Entity()
export class Transaction {
  @ApiProperty()
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty()
  @Column('decimal', {
    precision: 10,
    scale: 2,
    transformer: {
      to: (value: number): number => value,
      from: (value: string): number => parseFloat(value),
    },
  })
  amount: number;

  @ApiProperty({ enum: PaymentType })
  @Column({
    type: 'enum',
    enum: PaymentType,
  })
  paymentType: PaymentType;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  paymentReference?: string;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Invoice)
  @JoinColumn({ name: 'invoiceId' })
  invoice: Invoice;

  @Column()
  invoiceId: number;

  @ManyToOne(() => Client)
  @JoinColumn({ name: 'clientId' })
  client: Client;

  @Column()
  clientId: number;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'companyId' })
  company: Company;

  @Column()
  companyId: number;
}
