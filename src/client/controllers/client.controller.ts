import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  HttpStatus,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ClientService } from '../client.service';
import { CreateClientDto } from '../dto/create-client.dto';
import { UpdateClientDto } from '../dto/update-client.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ClientDetailsDto } from '../dto/client-details.dto';
import { Client } from '../client.entity';
import { AuthGuard } from '@nestjs/passport';
import { CompanyContextGuard } from '../../common/guards/company-context.guard';
import { RequestContext } from '../../common/interfaces/request-context.interface';
import { Request } from 'express';

@ApiTags('Client')
@ApiBearerAuth()
@Controller('client')
@UseGuards(AuthGuard('jwt'), CompanyContextGuard)
export class ClientController {
  constructor(private readonly clientService: ClientService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new client',
    description: "Creates a new client for the current user's company",
  })
  @ApiBody({ type: CreateClientDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Client has been successfully created',
    type: Client,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data or missing required fields',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized request',
  })
  async create(
    @Body() createClientDto: CreateClientDto,
    @Req() req: Request & { user: RequestContext['user'] },
  ): Promise<Client> {
    return this.clientService.create(createClientDto, req.user.company.id);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all clients',
    description: 'Retrieves a list of all clients',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of all clients retrieved successfully',
    type: [Client],
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized request',
  })
  async findAll(
    @Req() req: Request & { user: RequestContext['user'] },
  ): Promise<Client[]> {
    return this.clientService.findAll(req.user.company.id);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get client details by ID',
    description:
      'Retrieves detailed information about a specific client including their invoice statistics',
  })
  @ApiParam({
    name: 'id',
    description: 'Client ID',
    type: 'number',
    required: true,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Client details retrieved successfully',
    type: ClientDetailsDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Client not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized request',
  })
  async findOne(@Param('id') id: string): Promise<ClientDetailsDto> {
    return this.clientService.findOne(+id);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Update client details',
    description: 'Updates the information of an existing client',
  })
  @ApiParam({
    name: 'id',
    description: 'Client ID',
    type: 'number',
    required: true,
  })
  @ApiBody({ type: UpdateClientDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Client has been successfully updated',
    type: Client,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Client not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized request',
  })
  async update(
    @Param('id') id: string,
    @Body() updateClientDto: UpdateClientDto,
  ): Promise<Client> {
    return this.clientService.update(+id, updateClientDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a client',
    description: 'Removes a client from the system',
  })
  @ApiParam({
    name: 'id',
    description: 'Client ID',
    type: 'number',
    required: true,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Client has been successfully deleted',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Client not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized request',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Cannot delete client with existing invoices',
  })
  async remove(@Param('id') id: string): Promise<void> {
    return this.clientService.remove(+id);
  }
}
