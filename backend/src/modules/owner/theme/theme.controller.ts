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
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ThemeService } from './theme.service';
import { CreateThemeDto } from './dto/create-theme.dto';
import { UpdateThemeDto } from './dto/update-theme.dto';
import { ReorderSectionsDto } from './dto/reorder-sections.dto';
import { CreateSectionDto } from './dto/create-section.dto';
import { UpdateSectionDto } from './dto/update-section.dto';
import { PublishThemeDto } from './dto/publish-theme.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../../../common/guards/optional-jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { UserRole } from '../../../../prisma/generated/client';

@ApiTags('(Owner) Theme')
@Controller('owner/theme')
export class ThemeController {
  constructor(private readonly themeService: ThemeService) {}

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all themes, current live theme, and available base presets' })
  @ApiResponse({ status: 200, description: 'Theme collection retrieved successfully' })
  async findAll(@CurrentUser() user?: any) {
    return this.themeService.findAll(user?.tenantId);
  }

  @Get('live')
  @UseGuards(OptionalJwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get currently active live theme and sections for storefront or preview' })
  @ApiResponse({ status: 200, description: 'Live theme retrieved successfully' })
  async getLiveTheme(@CurrentUser() user?: any) {
    return this.themeService.getLiveTheme(user?.tenantId);
  }

  @Get(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get single theme details with sections and version history' })
  @ApiResponse({ status: 200, description: 'Theme details retrieved successfully' })
  async findOne(@Param('id') id: string, @CurrentUser() user?: any) {
    return this.themeService.findOne(id, user?.tenantId);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new draft theme or clone from preset' })
  @ApiResponse({ status: 201, description: 'Theme created successfully' })
  async create(@Body() dto: CreateThemeDto, @CurrentUser() user?: any) {
    return this.themeService.create(dto, user?.tenantId);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update theme design tokens and settings (Save Draft)' })
  @ApiResponse({ status: 200, description: 'Theme draft saved successfully' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateThemeDto,
    @CurrentUser() user?: any,
  ) {
    return this.themeService.update(id, dto, user?.tenantId);
  }

  @Post(':id/publish')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Publish theme to storefront and create audit snapshot version' })
  @ApiResponse({ status: 200, description: 'Theme published successfully' })
  async publish(
    @Param('id') id: string,
    @Body() dto: PublishThemeDto,
    @CurrentUser() user?: any,
  ) {
    return this.themeService.publish(id, dto, user?.tenantId, user);
  }

  @Post(':id/duplicate')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Duplicate an existing theme and its sections' })
  @ApiResponse({ status: 201, description: 'Theme duplicated successfully' })
  async duplicate(@Param('id') id: string, @CurrentUser() user?: any) {
    return this.themeService.duplicate(id, user?.tenantId);
  }

  @Put(':id/sections/reorder')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Batch reorder sections and toggle visibility' })
  @ApiResponse({ status: 200, description: 'Sections reordered successfully' })
  async reorderSections(
    @Param('id') id: string,
    @Body() dto: ReorderSectionsDto,
    @CurrentUser() user?: any,
  ) {
    return this.themeService.reorderSections(id, dto, user?.tenantId);
  }

  @Post(':id/sections')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a new section to a theme' })
  @ApiResponse({ status: 201, description: 'Section added successfully' })
  async addSection(
    @Param('id') id: string,
    @Body() dto: CreateSectionDto,
    @CurrentUser() user?: any,
  ) {
    return this.themeService.addSection(id, dto, user?.tenantId);
  }

  @Patch(':id/sections/:sectionId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a theme section' })
  @ApiResponse({ status: 200, description: 'Section updated successfully' })
  async updateSection(
    @Param('id') id: string,
    @Param('sectionId') sectionId: string,
    @Body() dto: UpdateSectionDto,
    @CurrentUser() user?: any,
  ) {
    return this.themeService.updateSection(id, sectionId, dto, user?.tenantId);
  }

  @Delete(':id/sections/:sectionId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a theme section' })
  @ApiResponse({ status: 200, description: 'Section removed successfully' })
  async deleteSection(
    @Param('id') id: string,
    @Param('sectionId') sectionId: string,
    @CurrentUser() user?: any,
  ) {
    return this.themeService.deleteSection(id, sectionId, user?.tenantId);
  }

  @Post(':id/restore/:versionId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Restore theme tokens and layout from an earlier version snapshot' })
  @ApiResponse({ status: 200, description: 'Theme restored successfully' })
  async restoreVersion(
    @Param('id') id: string,
    @Param('versionId') versionId: string,
    @CurrentUser() user?: any,
  ) {
    return this.themeService.restoreVersion(id, versionId, user?.tenantId);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a non-live theme' })
  @ApiResponse({ status: 200, description: 'Theme deleted successfully' })
  async delete(@Param('id') id: string, @CurrentUser() user?: any) {
    return this.themeService.delete(id, user?.tenantId);
  }
}
