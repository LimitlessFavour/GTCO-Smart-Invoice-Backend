import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientService } from './client.service';
import { ClientController } from './client.controller';
import { Client } from './client.entity';
import { Company } from 'src/company/company.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Client, Company])],
  providers: [ClientService],
  controllers: [ClientController],
})
export class ClientModule {}
