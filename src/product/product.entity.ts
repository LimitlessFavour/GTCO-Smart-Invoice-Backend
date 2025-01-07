import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { Company } from '../company/company.entity';
import { InvoiceItem } from '../invoice/invoice-item.entity';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  productName: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column({ unique: true })
  sku: string;

  @Column({ nullable: true })
  image: string;

  // Company relationship
  @Column({ type: 'int' })
  companyId: number;

  @ManyToOne(() => Company, (company) => company.products)
  company: Company;

  // Invoice items relationship
  @OneToMany(() => InvoiceItem, (invoiceItem) => invoiceItem.product)
  invoiceItems: InvoiceItem[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
