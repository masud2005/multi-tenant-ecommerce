import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CollectionService } from './collection.service';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { UpdateCollectionDto } from './dto/update-collection.dto';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

@ApiTags('(Owner) Collections')
@Controller('collections')
export class CollectionController {
  constructor(private readonly collectionService: CollectionService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new collection' })
  @ApiResponse({ status: 201, description: 'Collection created successfully' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  @ApiResponse({ status: 409, description: 'Collection slug already exists' })
  async create(
    @Body() dto: CreateCollectionDto,
    @CurrentUser() user?: any,
  ) {
    return this.collectionService.create(dto, user?.tenantId);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all collections for tenant' })
  @ApiResponse({ status: 200, description: 'Collections retrieved successfully' })
  async findAll(
    @Query('tenantId') tenantId?: string,
    @CurrentUser() user?: any,
  ) {
    return this.collectionService.findAll(tenantId || user?.tenantId);
  }

  @Get(':idOrSlug')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get single collection details by ID or Slug' })
  @ApiResponse({ status: 200, description: 'Collection details retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Collection not found' })
  async findOne(
    @Param('idOrSlug') idOrSlug: string,
    @Query('tenantId') tenantId?: string,
    @CurrentUser() user?: any,
  ) {
    return this.collectionService.findOne(idOrSlug, tenantId || user?.tenantId);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update an existing collection by ID or Slug' })
  @ApiResponse({ status: 200, description: 'Collection updated successfully' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 404, description: 'Collection not found' })
  @ApiResponse({ status: 409, description: 'Collection slug already in use' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCollectionDto,
    @CurrentUser() user?: any,
  ) {
    return this.collectionService.update(id, dto, user?.tenantId);
  }

  @Delete(':idOrSlug')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete collection by ID or Slug' })
  @ApiResponse({ status: 200, description: 'Collection deleted successfully' })
  @ApiResponse({ status: 404, description: 'Collection not found' })
  async remove(
    @Param('idOrSlug') idOrSlug: string,
    @Query('tenantId') tenantId?: string,
    @CurrentUser() user?: any,
  ) {
    return this.collectionService.remove(idOrSlug, tenantId || user?.tenantId);
  }
}
