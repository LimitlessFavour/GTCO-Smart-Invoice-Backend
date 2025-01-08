import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Invoice } from '../invoice/invoice.entity';
import { User } from '../user/user.entity';
import { Client } from '../client/client.entity';
import { Product } from '../product/entities/product.entity';

@Entity('companies')
export class Company {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ nullable: true })
  logo: string;

  // Relationship with User (Owner)
  @Column({ type: 'uuid' })
  userId: string;

  @OneToOne(() => User, (user) => user.company)
  @JoinColumn({ name: 'userId' })
  user: User;

  // Existing and new relationships
  @OneToMany(() => Invoice, (invoice) => invoice.company)
  invoices: Invoice[];

  @OneToMany(() => Client, (client) => client.company)
  clients: Client[];

  @OneToMany(() => Product, (product) => product.company)
  products: Product[];

  // Timestamps
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
