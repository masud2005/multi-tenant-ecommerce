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
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { BrandService } from './brand.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

@ApiTags('(Owner) Brands')
@Controller('brands')
export class BrandController {
  constructor(private readonly brandService: BrandService) {}

  @Post()
  // @UseGuards(JwtAuthGuard)
  // @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new brand' })
  @ApiResponse({ status: 201, description: 'Brand created successfully' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  @ApiResponse({ status: 409, description: 'Brand slug already exists' })
  async create(
    @Body() dto: CreateBrandDto,
    @CurrentUser() user?: any,
  ) {
    return this.brandService.create(dto, user?.tenantId);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all brands for tenant' })
  @ApiResponse({ status: 200, description: 'Brands retrieved successfully' })
  async findAll(
    @Query('tenantId') tenantId?: string,
    @CurrentUser() user?: any,
  ) {
    return this.brandService.findAll(tenantId || user?.tenantId);
  }

  @Get(':idOrSlug')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get single brand details by ID or Slug' })
  @ApiResponse({ status: 200, description: 'Brand details retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Brand not found' })
  async findOne(
    @Param('idOrSlug') idOrSlug: string,
    @Query('tenantId') tenantId?: string,
    @CurrentUser() user?: any,
  ) {
    return this.brandService.findOne(idOrSlug, tenantId || user?.tenantId);
  }

  @Patch(':idOrSlug')
  // @UseGuards(JwtAuthGuard)
  // @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update an existing brand' })
  @ApiResponse({ status: 200, description: 'Brand updated successfully' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 404, description: 'Brand not found' })
  @ApiResponse({ status: 409, description: 'Brand slug already exists' })
  async update(
    @Param('idOrSlug') idOrSlug: string,
    @Body() dto: UpdateBrandDto,
    @CurrentUser() user?: any,
  ) {
    return this.brandService.update(idOrSlug, dto, user?.tenantId);
  }

  @Delete(':idOrSlug')
  // @UseGuards(JwtAuthGuard)
  // @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a brand (soft delete)' })
  @ApiResponse({ status: 200, description: 'Brand deleted successfully' })
  @ApiResponse({ status: 404, description: 'Brand not found' })
  async remove(
    @Param('idOrSlug') idOrSlug: string,
    @CurrentUser() user?: any,
  ) {
    return this.brandService.remove(idOrSlug, user?.tenantId);
  }
}

