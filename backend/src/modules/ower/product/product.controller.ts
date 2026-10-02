import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
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
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { QueryProductDto } from './dto/query-product.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

@ApiTags('(Owner) Products')
@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  // @UseGuards(JwtAuthGuard)
  // @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new product with images, variants, and collections' })
  @ApiResponse({ status: 201, description: 'Product created successfully' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 404, description: 'Tenant, category, subcategory, or brand not found' })
  @ApiResponse({ status: 409, description: 'Product slug or duplicate variant conflict' })
  async create(
    @Body() dto: CreateProductDto,
    @CurrentUser() user?: any,
  ) {
    return this.productService.create(dto, user?.tenantId);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all products with filters, search, and pagination' })
  @ApiResponse({ status: 200, description: 'Products retrieved successfully' })
  async findAll(
    @Query() query: QueryProductDto,
    @CurrentUser() user?: any,
  ) {
    return this.productService.findAll(query, user?.tenantId);
  }

  @Get(':idOrSlug')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get single product details by ID or Slug' })
  @ApiResponse({ status: 200, description: 'Product details retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async findOne(
    @Param('idOrSlug') idOrSlug: string,
    @Query('tenantId') tenantId?: string,
    @CurrentUser() user?: any,
  ) {
    return this.productService.findOne(idOrSlug, tenantId || user?.tenantId);
  }
}
