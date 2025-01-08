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
import { InvoiceItem } from '../../invoice/invoice-item.entity';
import { ProductCategory } from '../enums/product-category.enum';
import { VatCategory } from '../enums/vat-category.enum';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  productName: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: ProductCategory,
    default: ProductCategory.OTHER,
  })
  category: ProductCategory;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column({ default: 1 })
  defaultQuantity: number;

  @Column({
    type: 'enum',
    enum: VatCategory,
    default: VatCategory.FIVE_PERCENT,
  })
  vatCategory: VatCategory;

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
