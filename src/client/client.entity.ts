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
import { Invoice } from '../invoice/invoice.entity';

@Entity('clients')
export class Client {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column()
  email: string;

  @Column()
  phoneNumber: string;

  @Column({ type: 'text' })
  address: string;

  // Company relationship
  @Column({ type: 'int' })
  companyId: number;

  @ManyToOne(() => Company, (company) => company.clients)
  company: Company;

  // Invoices relationship
  @OneToMany(() => Invoice, (invoice) => invoice.client)
  invoices: Invoice[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
