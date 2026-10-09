import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ThemeService } from '../services/theme.service';
import { CreateThemeDto } from '../dto/create-theme.dto';
import { UpdateThemeDto } from '../dto/update-theme.dto';
import { PublishThemeDto } from '../dto/publish-theme.dto';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../../../../common/guards/optional-jwt-auth.guard';
import { CurrentUser } from '../../../../common/decorators/current-user.decorator';

@ApiTags('(Owner) Theme')
@Controller('owner/theme')
export class ThemeController {
  constructor(private readonly themeService: ThemeService) {}

  // GET /owner/theme - returns live theme and all themes for the owner tenant
  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get current tenant themes and version history' })
  @ApiResponse({ status: 200, description: 'Theme data retrieved successfully' })
  async findAll(@CurrentUser() user: any) {
    return this.themeService.findAll(user.tenantId);
  }

  // GET /owner/theme/live - public storefront endpoint for active live theme
  @Get('live')
  @UseGuards(OptionalJwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get currently active live theme for the storefront (public)' })
  @ApiResponse({ status: 200, description: 'Live theme retrieved successfully' })
  async getLiveTheme(@CurrentUser() user?: any) {
    const tenantId = user?.tenantId;
    return this.themeService.getLiveTheme(tenantId);
  }

  // GET /owner/theme/:id - returns single theme details by ID
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get single theme details' })
  @ApiResponse({ status: 200, description: 'Theme details retrieved successfully' })
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.themeService.findOne(id, user.tenantId);
  }

  // POST /owner/theme - creates a new draft theme
  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new draft theme' })
  @ApiResponse({ status: 201, description: 'Theme created successfully' })
  async create(@Body() dto: CreateThemeDto, @CurrentUser() user: any) {
    return this.themeService.create(dto, user.tenantId);
  }

  // PATCH /owner/theme/:id - saves draft changes to design tokens and brand settings
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update theme design tokens and brand settings (Save Draft)' })
  @ApiResponse({ status: 200, description: 'Theme draft saved successfully' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateThemeDto,
    @CurrentUser() user: any,
  ) {
    return this.themeService.update(id, dto, user.tenantId);
  }

  // POST /owner/theme/:id/publish - publishes theme draft live and creates version snapshot
  @Post(':id/publish')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Publish theme live to storefront' })
  @ApiResponse({ status: 200, description: 'Theme published successfully' })
  async publish(
    @Param('id') id: string,
    @Body() dto: PublishThemeDto,
    @CurrentUser() user: any,
  ) {
    return this.themeService.publish(id, dto, user.tenantId, user);
  }

  // POST /owner/theme/:id/restore/:versionId - restores theme tokens and sections from past version
  @Post(':id/restore/:versionId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Restore theme from a past version snapshot' })
  @ApiResponse({ status: 200, description: 'Theme restored successfully' })
  async restoreVersion(
    @Param('id') id: string,
    @Param('versionId') versionId: string,
    @CurrentUser() user: any,
  ) {
    return this.themeService.restoreVersion(id, versionId, user.tenantId);
  }
}
