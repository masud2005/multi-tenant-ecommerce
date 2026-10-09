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
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { OwnerFaqService } from './faq.service';
import { CreateFaqDto } from './dto/create-faq.dto';
import { UpdateFaqDto } from './dto/update-faq.dto';
import { BatchSaveFaqDto } from './dto/batch-save-faq.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { UserRole } from '../../../../prisma/generated/client';

@ApiTags('(Owner) FAQs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.OWNER)
@Controller('owner/faq')
export class OwnerFaqController {
  constructor(private readonly faqService: OwnerFaqService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a single FAQ item' })
  @ApiResponse({ status: 201, description: 'FAQ item created successfully' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Owner role required' })
  async create(
    @Body() dto: CreateFaqDto,
    @CurrentUser() user?: any,
  ) {
    return this.faqService.create(dto, user?.tenantId);
  }

  @Post('batch')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Batch save or replace all FAQ items for tenant' })
  @ApiResponse({ status: 200, description: 'FAQ items batch saved successfully' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Owner role required' })
  async batchSave(
    @Body() dto: BatchSaveFaqDto,
    @CurrentUser() user?: any,
  ) {
    return this.faqService.batchSave(dto, user?.tenantId);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all FAQ items for owner tenant' })
  @ApiQuery({ name: 'category', required: false, description: 'Filter by category' })
  @ApiResponse({ status: 200, description: 'FAQ items retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Owner role required' })
  async findAll(
    @Query('category') category?: string,
    @CurrentUser() user?: any,
  ) {
    return this.faqService.findAll(user?.tenantId, category);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get single FAQ item details' })
  @ApiResponse({ status: 200, description: 'FAQ item retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Owner role required' })
  @ApiResponse({ status: 404, description: 'FAQ item not found' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user?: any,
  ) {
    return this.faqService.findOne(id, user?.tenantId);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update an existing FAQ item' })
  @ApiResponse({ status: 200, description: 'FAQ item updated successfully' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Owner role required' })
  @ApiResponse({ status: 404, description: 'FAQ item not found' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateFaqDto,
    @CurrentUser() user?: any,
  ) {
    return this.faqService.update(id, dto, user?.tenantId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a FAQ item' })
  @ApiResponse({ status: 200, description: 'FAQ item deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Owner role required' })
  @ApiResponse({ status: 404, description: 'FAQ item not found' })
  async remove(
    @Param('id') id: string,
    @CurrentUser() user?: any,
  ) {
    return this.faqService.remove(id, user?.tenantId);
  }
}
