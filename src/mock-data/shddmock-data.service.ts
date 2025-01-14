// /* eslint-disable @typescript-eslint/no-unused-vars */
// import { Injectable, Logger } from '@nestjs/common';
// import { InjectRepository } from '@nestjs/typeorm';
// import { Repository } from 'typeorm';
// import { faker } from '@faker-js/faker';
// import { User } from '../user/user.entity';
// import { Company } from '../company/company.entity';
// import { Client } from '../client/client.entity';
// import { Product } from '../product/entities/product.entity';
// import { Invoice } from '../invoice/invoice.entity';
// import { Transaction } from '../transaction/transaction.entity';
// import { Activity } from '../activity/activity.entity';
// import { InvoiceStatus } from '../invoice/enums/invoice-status.enum';
// import { ActivityType } from '../activity/activity.entity';
// import { ProductCategory } from '../product/enums/product-category.enum';
// import { VatCategory } from '../product/enums/vat-category.enum';
// import { IsNull } from 'typeorm';

// @Injectable()
// export class MockDataService {
//     private readonly logger = new Logger(MockDataService.name);
//     private readonly MOCK_DATA_TAG = 'MOCK_DATA';

//     constructor(
//         @InjectRepository(User) private userRepository: Repository<User>,
//         @InjectRepository(Company) private companyRepository: Repository<Company>,
//         @InjectRepository(Client) private clientRepository: Repository<Client>,
//         @InjectRepository(Product) private productRepository: Repository<Product>,
//         @InjectRepository(Invoice) private invoiceRepository: Repository<Invoice>,
//         @InjectRepository(Transaction)
//         private transactionRepository: Repository<Transaction>,
//         @InjectRepository(Activity)
//         private activityRepository: Repository<Activity>,
//     ) { }

//     async generateMockData() {
//         try {
//             this.logger.log('Starting mock data generation...');

//             // Generate base data
//             const company = await this.generateMockCompany();
//             const clients = await this.generateMockClients(50, company.id);
//             const products = await this.generateMockProducts(30, company.id);

//             // Generate invoices and related data
//             await this.generateMockInvoices(clients, products, company, 100);

//             return {
//                 message: 'Mock data generated successfully',
//                 summary: {
//                     clients: 50,
//                     products: 30,
//                     invoices: 100,
//                 },
//             };
//         } catch (error) {
//             this.logger.error('Failed to generate mock data', error.stack);
//             throw error;
//         }
//     }

//     private async generateMockCompany(): Promise<Company> {
//         const company = this.companyRepository.create({
//             name: faker.company.name(),
//             description: faker.company.catchPhrase(),
//             logo: faker.image.urlLoremFlickr({ category: 'business' }),
//             totalRevenue: 0,
//             withdrawableRevenue: 0,
//             userId: faker.string.uuid(),
//         });

//         return await this.companyRepository.save(company);
//     }

//     private async generateMockClients(
//         count: number,
//         companyId: number,
//     ): Promise<Client[]> {
//         const clients: Client[] = [];

//         for (let i = 0; i < count; i++) {
//             const client = this.clientRepository.create({
//                 firstName: faker.person.firstName(),
//                 lastName: faker.person.lastName(),
//                 email: faker.internet.email(),
//                 phoneNumber: faker.phone.number(),
//                 address: faker.location.streetAddress(),
//                 companyId,
//             });
//             clients.push(client);
//         }

//         return await this.clientRepository.save(clients);
//     }

//     private async generateMockProducts(
//         count: number,
//         companyId: number,
//     ): Promise<Product[]> {
//         const products: Product[] = [];

//         for (let i = 0; i < count; i++) {
//             const productName = faker.commerce.productName();
//             const sku = `${productName.slice(0, 3).toUpperCase()}-${companyId}-${Date.now().toString().slice(-4)}`;

//             const product = this.productRepository.create({
//                 productName,
//                 description: faker.commerce.productDescription(),
//                 price: parseFloat(faker.commerce.price({ min: 1000, max: 50000 })),
//                 sku,
//                 companyId,
//                 category: faker.helpers.arrayElement(Object.values(ProductCategory)),
//                 vatCategory: VatCategory.FIVE_PERCENT,
//                 defaultQuantity: faker.number.int({ min: 1, max: 10 }),
//             });
//             products.push(product);
//         }

//         return await this.productRepository.save(products);
//     }

//     private async generateMockInvoices(
//         clients: Client[],
//         products: Product[],
//         company: Company,
//         count: number,
//     ): Promise<void> {
//         const statuses = [
//             InvoiceStatus.PAID,
//             InvoiceStatus.UNPAID,
//             InvoiceStatus.OVERDUE,
//             InvoiceStatus.DRAFT,
//         ];

//         let totalCompanyRevenue = 0;

//         for (let i = 0; i < count; i++) {
//             const client = faker.helpers.arrayElement(clients);
//             const itemCount = faker.number.int({ min: 1, max: 5 });
//             const items = [];
//             let totalAmount = 0;

//             // Generate invoice items
//             for (let j = 0; j < itemCount; j++) {
//                 const product = faker.helpers.arrayElement(products);
//                 const quantity = faker.number.int({ min: 1, max: 10 });
//                 const amount = product.price * quantity;
//                 totalAmount += amount;

//                 items.push({
//                     productId: product.id,
//                     quantity,
//                     unitPrice: product.price,
//                     amount,
//                 });
//             }

//             const status = faker.helpers.arrayElement(statuses);
//             const createdAt = faker.date.past({ years: 1 });
//             const dueDate = faker.date.future({ years: 1, refDate: createdAt });

//             // Create invoice
//             const invoice = await this.invoiceRepository.save(
//                 this.invoiceRepository.create({
//                     invoiceNumber: `INV-${Date.now()}-${i}`,
//                     clientId: client.id,
//                     companyId: company.id,
//                     items,
//                     totalAmount,
//                     status,
//                     dueDate,
//                     createdAt,
//                 }),
//             );

//             // Create transaction for paid invoices
//             if (status === InvoiceStatus.PAID) {
//                 const transaction = await this.transactionRepository.save(
//                     this.transactionRepository.create({
//                         invoice,
//                         amount: totalAmount,
//                         paymentStatus: 'successful',
//                         paymentMethod: faker.helpers.arrayElement([
//                             'card',
//                             'transfer',
//                             'cash',
//                         ]),
//                         paymentReference: `TRX-${faker.string.alphanumeric(10)}`,
//                         client,
//                         company,
//                     }),
//                 );
//                 totalCompanyRevenue += totalAmount;
//             }

//             // Create activity log
//             await this.activityRepository.save(
//                 this.activityRepository.create({
//                     type: ActivityType.INVOICE_CREATED,
//                     entityType: 'INVOICE',
//                     entityId: invoice.id,
//                     companyId: company.id,
//                     metadata: {
//                         invoiceNumber: invoice.invoiceNumber,
//                         amount: totalAmount,
//                     },
//                 }),
//             );
//         }

//         // Update company revenue
//         company.totalRevenue = totalCompanyRevenue;
//         company.withdrawableRevenue = totalCompanyRevenue;
//         await this.companyRepository.save(company);
//     }

//     async clearMockData() {
//         try {
//             this.logger.log('Clearing mock data...');

//             // Delete in reverse order of dependencies
//             await this.transactionRepository.delete({ paymentStatus: 'successful' });
//             await this.invoiceRepository.delete({ status: InvoiceStatus.DRAFT });
//             await this.clientRepository.delete({ companyId: IsNull() });
//             await this.productRepository.delete({ companyId: IsNull() });
//             await this.activityRepository.delete({
//                 type: ActivityType.INVOICE_CREATED,
//             });
//             await this.companyRepository.delete({ userId: IsNull() });

//             return {
//                 message: 'Mock data cleared successfully',
//             };
//         } catch (error) {
//             this.logger.error('Failed to clear mock data', error.stack);
//             throw error;
//         }
//     }
// }
