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
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

@ApiTags('(Owner) Categories')
@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  // @UseGuards(JwtAuthGuard)
  // @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new category or subcategory' })
  @ApiResponse({ status: 201, description: 'Category created successfully' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 404, description: 'Tenant or parent category not found' })
  @ApiResponse({ status: 409, description: 'Category slug or name already exists' })
  async create(
    @Body() dto: CreateCategoryDto,
    @CurrentUser() user?: any,
  ) {
    return this.categoryService.create(dto, user?.tenantId);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all categories for tenant' })
  @ApiResponse({ status: 200, description: 'Categories retrieved successfully' })
  async findAll(
    @Query('tenantId') tenantId?: string,
    @CurrentUser() user?: any,
  ) {
    return this.categoryService.findAll(tenantId || user?.tenantId);
  }

  @Get(':idOrSlug')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get single category details by ID or Slug' })
  @ApiResponse({ status: 200, description: 'Category details retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async findOne(
    @Param('idOrSlug') idOrSlug: string,
    @Query('tenantId') tenantId?: string,
    @CurrentUser() user?: any,
  ) {
    return this.categoryService.findOne(idOrSlug, tenantId || user?.tenantId);
  }

  @Patch(':idOrSlug')
  // @UseGuards(JwtAuthGuard)
  // @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update an existing category or subcategory' })
  @ApiResponse({ status: 200, description: 'Category updated successfully' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 404, description: 'Category or parent not found' })
  @ApiResponse({ status: 409, description: 'Category slug or subcategory name conflict' })
  async update(
    @Param('idOrSlug') idOrSlug: string,
    @Body() dto: UpdateCategoryDto,
    @CurrentUser() user?: any,
  ) {
    return this.categoryService.update(idOrSlug, dto, user?.tenantId);
  }

  @Delete(':idOrSlug')
  // @UseGuards(JwtAuthGuard)
  // @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a category or subcategory' })
  @ApiResponse({ status: 200, description: 'Category deleted successfully' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async remove(
    @Param('idOrSlug') idOrSlug: string,
    @Query('tenantId') tenantId?: string,
    @CurrentUser() user?: any,
  ) {
    return this.categoryService.remove(idOrSlug, tenantId || user?.tenantId);
  }
}


