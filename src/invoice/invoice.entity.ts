import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Company } from '../company/company.entity';
import { Client } from '../client/client.entity';
import { InvoiceItem } from './invoice-item.entity';
import { InvoiceStatus } from './enums/invoice-status.enum';
import { ApiProperty } from '@nestjs/swagger';

@Entity()
export class Invoice {
  @ApiProperty({ description: 'Unique identifier of the invoice' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: 'Invoice number' })
  @Column()
  invoiceNumber: string;

  @ApiProperty({ description: 'Due date of the invoice' })
  @Column()
  dueDate: Date;
  @ApiProperty({
    description: 'Current status of the invoice',
    enum: InvoiceStatus,
  })
  @Column({
    type: 'enum',
    enum: InvoiceStatus,
    default: InvoiceStatus.UNPAID,
  })
  status: InvoiceStatus;

  @ApiProperty({ description: 'Total amount of the invoice' })
  @Column('decimal', { precision: 10, scale: 2 })
  totalAmount: number;

  @ApiProperty({ description: 'Payment link for the invoice', required: false })
  @Column({ nullable: true })
  paymentLink: string;

  @ApiProperty({ description: 'Transaction reference', required: false })
  @Column({ nullable: true })
  transactionRef: string;

  @ApiProperty({
    description: 'Date when the invoice was paid',
    required: false,
  })
  @Column({ nullable: true })
  paidAt: Date;

  @ApiProperty({ type: () => Company })
  @ManyToOne(() => Company, (company) => company.invoices)
  @JoinColumn({ name: 'companyId' })
  company: Company;

  @ApiProperty({ type: () => Client })
  @ManyToOne(() => Client, (client) => client.invoices)
  @JoinColumn({ name: 'clientId' })
  client: Client;

  @ApiProperty({ type: () => [InvoiceItem] })
  @OneToMany(() => InvoiceItem, (invoiceItem) => invoiceItem.invoice)
  items: InvoiceItem[];

  @ApiProperty({ description: 'Squad transaction reference', required: false })
  @Column({ nullable: true })
  squadTransactionRef: string;

  @CreateDateColumn()
  createdAt: Date;
}
