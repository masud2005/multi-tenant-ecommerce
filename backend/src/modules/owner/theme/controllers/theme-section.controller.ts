import {
  Body,
  Controller,
  Delete,
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
import { ReorderSectionsDto } from '../dto/reorder-sections.dto';
import { CreateSectionDto } from '../dto/create-section.dto';
import { UpdateSectionDto } from '../dto/update-section.dto';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../../common/decorators/current-user.decorator';

@ApiTags('(Owner) Theme Sections')
@Controller('owner/theme')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ThemeSectionController {
  constructor(private readonly themeService: ThemeService) {}

  // PATCH /owner/theme/:id/sections/reorder - batch reorder sections and toggle visibility
  @Patch(':id/sections/reorder')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Batch reorder sections and toggle visibility' })
  @ApiResponse({ status: 200, description: 'Sections reordered successfully' })
  async reorderSections(
    @Param('id') id: string,
    @Body() dto: ReorderSectionsDto,
    @CurrentUser() user: any,
  ) {
    return this.themeService.reorderSections(id, dto, user.tenantId);
  }

  // POST /owner/theme/:id/sections - add a new section to a theme
  @Post(':id/sections')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a new section to a theme' })
  @ApiResponse({ status: 201, description: 'Section added successfully' })
  async addSection(
    @Param('id') id: string,
    @Body() dto: CreateSectionDto,
    @CurrentUser() user: any,
  ) {
    return this.themeService.addSection(id, dto, user.tenantId);
  }

  // PATCH /owner/theme/:id/sections/:sectionId - update a theme section
  @Patch(':id/sections/:sectionId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a theme section' })
  @ApiResponse({ status: 200, description: 'Section updated successfully' })
  async updateSection(
    @Param('id') id: string,
    @Param('sectionId') sectionId: string,
    @Body() dto: UpdateSectionDto,
    @CurrentUser() user: any,
  ) {
    return this.themeService.updateSection(id, sectionId, dto, user.tenantId);
  }

  // DELETE /owner/theme/:id/sections/:sectionId - delete a section from a theme
  @Delete(':id/sections/:sectionId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a section from a theme' })
  @ApiResponse({ status: 200, description: 'Section removed successfully' })
  async deleteSection(
    @Param('id') id: string,
    @Param('sectionId') sectionId: string,
    @CurrentUser() user: any,
  ) {
    return this.themeService.deleteSection(id, sectionId, user.tenantId);
  }
}
