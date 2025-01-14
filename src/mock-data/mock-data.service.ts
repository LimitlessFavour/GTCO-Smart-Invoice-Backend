import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { faker } from '@faker-js/faker';
import { User } from '../user/user.entity';
import { Company } from '../company/company.entity';
import { Client } from '../client/client.entity';
import { Product } from '../product/entities/product.entity';
import { Invoice } from '../invoice/invoice.entity';
import { PaymentType, Transaction } from '../transaction/transaction.entity';
import { Activity, ActivityType } from '../activity/activity.entity';
import { InvoiceStatus } from '../invoice/enums/invoice-status.enum';
import { ProductCategory } from '../product/enums/product-category.enum';
import { VatCategory } from '../product/enums/vat-category.enum';
import { ActivityService } from '../activity/activity.service';
import { InvoiceItem } from 'src/invoice/invoice-item.entity';

@Injectable()
export class MockDataService {
  private readonly logger = new Logger(MockDataService.name);

  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(Company) private companyRepository: Repository<Company>,
    @InjectRepository(Client) private clientRepository: Repository<Client>,
    @InjectRepository(Product) private productRepository: Repository<Product>,
    @InjectRepository(Invoice) private invoiceRepository: Repository<Invoice>,
    @InjectRepository(InvoiceItem)
    private invoiceItemRepository: Repository<InvoiceItem>,
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    @InjectRepository(Activity)
    private activityRepository: Repository<Activity>,
    private readonly activityService: ActivityService,
  ) {}

  async generateMockData() {
    try {
      this.logger.log('Starting mock data generation...');

      // Create mock user and company
      const user = await this.generateMockUser();
      const company = await this.generateMockCompany(user.id);

      // Update user with company
      user.company = company;
      user.onboardingStep = 2;
      user.onboardingCompleted = true;
      await this.userRepository.save(user);

      // Generate related data
      const clients = await this.generateMockClients(50, company.id);
      const products = await this.generateMockProducts(30, company.id);
      await this.generateMockInvoices(clients, products, company, 100);

      return {
        message: 'Mock data generated successfully',
        summary: {
          clients: 50,
          products: 30,
          invoices: 100,
        },
      };
    } catch (error) {
      this.logger.error('Failed to generate mock data', error.stack);
      throw error;
    }
  }

  private async generateMockUser(): Promise<User> {
    const user = this.userRepository.create({
      id: faker.string.uuid(),
      email: faker.internet.email(),
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      phoneNumber: faker.phone.number(),
      location: faker.location.country(),
      onboardingStep: 1,
      onboardingCompleted: false,
    });

    return await this.userRepository.save(user);
  }

  private async generateMockCompany(userId: string): Promise<Company> {
    const company = this.companyRepository.create({
      name: faker.company.name(),
      description: faker.company.catchPhrase(),
      logo: faker.image.urlLoremFlickr({ category: 'business' }),
      totalRevenue: 0,
      withdrawableRevenue: 0,
      userId,
    });

    const savedCompany = await this.companyRepository.save(company);

    await this.activityService.create({
      type: ActivityType.COMPANY_CREATED,
      entityType: 'COMPANY',
      entityId: savedCompany.id.toString(),
      companyId: savedCompany.id.toString(),
      metadata: {
        name: savedCompany.name,
        description: savedCompany.description,
      },
    });

    return savedCompany;
  }

  private async generateMockClients(
    count: number,
    companyId: number,
  ): Promise<Client[]> {
    const clients: Client[] = [];

    for (let i = 0; i < count; i++) {
      const client = this.clientRepository.create({
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        email: faker.internet.email(),
        phoneNumber: faker.phone.number(),
        address: faker.location.streetAddress(),
        companyId,
      });
      clients.push(client);
    }

    return await this.clientRepository.save(clients);
  }

  private async generateMockProducts(
    count: number,
    companyId: number,
  ): Promise<Product[]> {
    const products: Product[] = [];
    const timestamp = Date.now();

    for (let i = 0; i < count; i++) {
      const productName = faker.commerce.productName();
      // Ensure unique SKU by using timestamp and index
      const sku = `${productName.slice(0, 3).toUpperCase()}-${companyId}-${timestamp}-${i}`;

      const product = this.productRepository.create({
        productName,
        description: faker.commerce.productDescription(),
        price: parseFloat(faker.commerce.price({ min: 1000, max: 50000 })),
        sku,
        companyId,
        category: faker.helpers.arrayElement(Object.values(ProductCategory)),
        vatCategory: VatCategory.FIVE_PERCENT,
        defaultQuantity: faker.number.int({ min: 1, max: 10 }),
      });
      products.push(product);
    }

    try {
      return await this.productRepository.save(products);
    } catch (error) {
      this.logger.error('Failed to generate mock products', error.stack);
      throw new Error('Failed to generate mock products: ' + error.message);
    }
  }

  private async generateMockInvoices(
    clients: Client[],
    products: Product[],
    company: Company,
    count: number,
  ): Promise<void> {
    const statuses = [
      InvoiceStatus.PAID,
      InvoiceStatus.UNPAID,
      InvoiceStatus.OVERDUE,
      InvoiceStatus.DRAFT,
    ];

    let totalCompanyRevenue = 0;

    for (let i = 0; i < count; i++) {
      const client = faker.helpers.arrayElement(clients);
      const itemCount = faker.number.int({ min: 1, max: 5 });
      const items = [];
      let totalAmount = 0;

      for (let j = 0; j < itemCount; j++) {
        const product = faker.helpers.arrayElement(products);
        const quantity = faker.number.int({ min: 1, max: 10 });
        const amount = product.price * quantity;
        totalAmount += amount;

        items.push({
          productId: product.id,
          quantity,
          unitPrice: product.price,
          amount,
        });
      }

      const status = faker.helpers.arrayElement(statuses);
      const createdAt = faker.date.past({ years: 1 });
      const dueDate = faker.date.future({ years: 1, refDate: createdAt });

      const invoice = await this.invoiceRepository.save(
        this.invoiceRepository.create({
          invoiceNumber: `INV-${Date.now()}-${i}`,
          client: client,
          company: company,
          items: items,
          totalAmount: totalAmount,
          status: status,
          dueDate: dueDate,
          createdAt: createdAt,
        }),
      );

      if (status === InvoiceStatus.PAID) {
        await this.transactionRepository.save(
          this.transactionRepository.create({
            invoiceId: invoice.id,
            amount: totalAmount,
            paymentType: PaymentType.MANUAL,
            paymentReference: `TRX-${faker.string.alphanumeric(10)}`,
            clientId: client.id,
            companyId: company.id,
            createdAt: new Date(),
          }),
        );
        totalCompanyRevenue += totalAmount;
      }

      //   await this.activityRepository.save(
      //     this.activityRepository.create({
      //       type: ActivityType.INVOICE_CREATED,
      //       entityType: 'INVOICE',
      //       entityId: invoice.id,
      //       companyId: company.id,
      //       metadata: {
      //         invoiceNumber: invoice.invoiceNumber,
      //         amount: totalAmount,
      //       },
      //     }),
      //   );
    }

    company.totalRevenue = totalCompanyRevenue;
    company.withdrawableRevenue = totalCompanyRevenue;
    await this.companyRepository.save(company);
  }

  async clearMockData() {
    try {
      this.logger.log('Clearing mock data...');

      // Clear in correct order to avoid foreign key constraints
      await this.transactionRepository.delete({});

      // First clear invoice items (they reference invoices)
      await this.invoiceItemRepository.delete({});

      // Then clear invoices
      await this.invoiceRepository.delete({});

      await this.productRepository.delete({});
      await this.clientRepository.delete({});
      await this.activityRepository.delete({});
      await this.companyRepository.delete({});
      await this.userRepository.delete({});

      return {
        message: 'Mock data cleared successfully',
      };
    } catch (error) {
      this.logger.error('Failed to clear mock data', error.stack);
      throw error;
    }
  }
}
