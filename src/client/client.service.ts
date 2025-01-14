import {
  Injectable,
  NotFoundException,
  //   BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client } from './client.entity';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { ClientDetailsDto } from './dto/client-details.dto';
import { InvoiceStatus } from '../invoice/enums/invoice-status.enum';
import { Company } from '../company/company.entity';
import { NotificationService } from '../notification/notification.service';
import { NotificationType } from '../notification/notification.entity';
import { ActivityService } from '../activity/activity.service';
import { ActivityType } from '../activity/activity.entity';

@Injectable()
export class ClientService {
  constructor(
    @InjectRepository(Client)
    private clientRepository: Repository<Client>,
    @InjectRepository(Company)
    private companyRepository: Repository<Company>,
    private readonly notificationService: NotificationService,
    private readonly activityService: ActivityService,
  ) {}

  async create(
    createClientDto: CreateClientDto,
    companyId: number,
  ): Promise<Client> {
    const client = this.clientRepository.create({
      ...createClientDto,
      companyId,
    });

    // Send notification for new client
    await this.notificationService.createNotification(
      NotificationType.CLIENT_CREATED,
      companyId,
      'New Client Added',
      `New client ${client.firstName} ${client.lastName} has been added`,
      {
        clientId: client.id,
        email: client.email,
      },
    );

    return this.clientRepository.save(client);
  }

  async findAll(companyId: number): Promise<Client[]> {
    return this.clientRepository.find({
      where: { companyId },
    });
  }

  async findOne(id: number): Promise<ClientDetailsDto> {
    const client = await this.clientRepository.findOne({
      where: { id },
      relations: ['invoices'],
    });

    if (!client) {
      throw new NotFoundException(`Client with ID ${id} not found`);
    }

    const totalOverdueAmount = client.invoices
      .filter((invoice) => invoice.status === InvoiceStatus.OVERDUE)
      .reduce((sum, invoice) => sum + invoice.totalAmount, 0);

    const totalDraftedAmount = client.invoices
      .filter((invoice) => invoice.status === InvoiceStatus.DRAFT)
      .reduce((sum, invoice) => sum + invoice.totalAmount, 0);

    const totalPaidAmount = client.invoices
      .filter((invoice) => invoice.status === InvoiceStatus.PAID)
      .reduce((sum, invoice) => sum + invoice.totalAmount, 0);

    const totalInvoicesSent = client.invoices.filter(
      (invoice) => invoice.status !== InvoiceStatus.DRAFT,
    ).length;

    const totalInvoicesDrafted = client.invoices.filter(
      (invoice) => invoice.status === InvoiceStatus.DRAFT,
    ).length;

    const clientDetails = new ClientDetailsDto(client);
    clientDetails.totalOverdueAmount = totalOverdueAmount;
    clientDetails.totalDraftedAmount = totalDraftedAmount;
    clientDetails.totalPaidAmount = totalPaidAmount;
    clientDetails.totalInvoicesSent = totalInvoicesSent;
    clientDetails.totalInvoicesDrafted = totalInvoicesDrafted;

    return clientDetails;
  }

  async findOneEntity(id: number): Promise<Client> {
    const client = await this.clientRepository.findOne({
      where: { id },
    });

    if (!client) {
      throw new NotFoundException(`Client with ID ${id} not found`);
    }

    return client;
  }

  async update(id: number, updateClientDto: UpdateClientDto): Promise<Client> {
    const client = await this.findOne(id);

    // Update client
    Object.assign(client, updateClientDto);
    const updatedClient = await this.clientRepository.save(client);

    // Record activity
    await this.activityService.create({
      type: ActivityType.CLIENT_UPDATED,
      entityType: 'CLIENT',
      entityId: client.id.toString(),
      companyId: (0).toString(),
      metadata: {
        updatedFields: Object.keys(updateClientDto),
        email: client.email,
        name: `${client.firstName} ${client.lastName}`,
      },
    });

    return updatedClient;
  }

  async remove(id: number): Promise<void> {
    const client = await this.findOneEntity(id);
    await this.clientRepository.remove(client);
  }
}
