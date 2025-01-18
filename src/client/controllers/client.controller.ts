/* eslint-disable @typescript-eslint/no-unused-vars */
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
import { CreateClientResponseDto } from '../dto/responses/create-client-response.dto';
import { ClientListResponseDto } from '../dto/responses/client-list-response.dto';
import { UpdateClientResponseDto } from '../dto/responses/update-client-response.dto';
import { DeleteClientResponseDto } from '../dto/responses/delete-client-response.dto';

@ApiTags('Client')
@ApiBearerAuth()
@Controller('client')
@UseGuards(AuthGuard('jwt'))
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
    type: CreateClientResponseDto,
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
  ): Promise<CreateClientResponseDto> {
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
    type: ClientListResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized request',
  })
  async findAll(
    @Req() req: Request & { user: RequestContext['user'] },
  ): Promise<ClientListResponseDto> {
    const clients = await this.clientService.findAll(req.user.company.id);
    return {
      data: clients,
      total: clients.length,
    };
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
    type: UpdateClientResponseDto,
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
  ): Promise<UpdateClientResponseDto> {
    const updatedClient = await this.clientService.update(+id, updateClientDto);
    return {
      client: updatedClient,
      message: 'Client updated successfully',
    };
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
    type: DeleteClientResponseDto,
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
  async remove(@Param('id') id: string): Promise<DeleteClientResponseDto> {
    await this.clientService.remove(+id);
    return {
      message: 'Client deleted successfully',
      statusCode: HttpStatus.OK,
    };
  }
}
