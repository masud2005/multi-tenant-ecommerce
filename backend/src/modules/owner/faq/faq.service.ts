import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateFaqDto } from './dto/create-faq.dto';
import { UpdateFaqDto } from './dto/update-faq.dto';
import { BatchSaveFaqDto } from './dto/batch-save-faq.dto';
import { ResponseHelper } from '../../../common/helpers/response.helper';
import {
  ConflictException,
  NotFoundException,
} from '../../../common/exceptions/business.exception';

@Injectable()
export class OwnerFaqService {
  private readonly logger = new Logger(OwnerFaqService.name);

  constructor(private readonly prisma: PrismaService) {}

  // 1. Create a single FAQ item
  async create(dto: CreateFaqDto, tenantId?: string) {
    if (!tenantId) {
      throw new ConflictException('Tenant could not be resolved from authenticated user.');
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });
    if (!tenant) {
      throw new NotFoundException('Tenant');
    }

    const created = await this.prisma.faqItem.create({
      data: {
        tenantId,
        category: dto.category.trim(),
        question: dto.question.trim(),
        answer: dto.answer.trim(),
        order: dto.order ?? 0,
      },
    });

    this.logger.log(`Created FAQ item [${created.id}] for tenant [${tenantId}]`);
    return ResponseHelper.created(created, 'FAQ item created successfully');
  }

  // 2. Batch save / replace FAQ items
  async batchSave(dto: BatchSaveFaqDto, tenantId?: string) {
    if (!tenantId) {
      throw new ConflictException('Tenant could not be resolved from authenticated user.');
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });
    if (!tenant) {
      throw new NotFoundException('Tenant');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      // Remove previous FAQ items for this tenant
      await tx.faqItem.deleteMany({
        where: { tenantId },
      });

      // Insert new items
      if (dto.items && dto.items.length > 0) {
        await tx.faqItem.createMany({
          data: dto.items.map((item, index) => ({
            tenantId,
            category: item.category.trim(),
            question: item.question.trim(),
            answer: item.answer.trim(),
            order: item.order ?? index,
          })),
        });
      }

      return tx.faqItem.findMany({
        where: { tenantId },
        orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
      });
    });

    this.logger.log(`Batch saved ${result.length} FAQ items for tenant [${tenantId}]`);
    return ResponseHelper.success(result, 'FAQ items saved successfully');
  }

  // 3. Get all FAQ items for tenant
  async findAll(tenantId?: string, category?: string) {
    if (!tenantId) {
      throw new ConflictException('Tenant could not be resolved from authenticated user.');
    }

    const where: any = { tenantId };
    if (category) {
      where.category = { equals: category, mode: 'insensitive' };
    }

    const items = await this.prisma.faqItem.findMany({
      where,
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    });

    return ResponseHelper.success(items, 'FAQ items retrieved successfully');
  }

  // 4. Get single FAQ item
  async findOne(id: string, tenantId?: string) {
    if (!tenantId) {
      throw new ConflictException('Tenant could not be resolved from authenticated user.');
    }

    const item = await this.prisma.faqItem.findFirst({
      where: { id, tenantId },
    });

    if (!item) {
      throw new NotFoundException(`FAQ item with ID ${id}`);
    }

    return ResponseHelper.success(item, 'FAQ item retrieved successfully');
  }

  // 5. Update single FAQ item
  async update(id: string, dto: UpdateFaqDto, tenantId?: string) {
    if (!tenantId) {
      throw new ConflictException('Tenant could not be resolved from authenticated user.');
    }

    const existing = await this.prisma.faqItem.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      throw new NotFoundException(`FAQ item with ID ${id}`);
    }

    const updated = await this.prisma.faqItem.update({
      where: { id },
      data: {
        ...(dto.category ? { category: dto.category.trim() } : {}),
        ...(dto.question ? { question: dto.question.trim() } : {}),
        ...(dto.answer ? { answer: dto.answer.trim() } : {}),
        ...(dto.order !== undefined ? { order: dto.order } : {}),
      },
    });

    this.logger.log(`Updated FAQ item [${id}] for tenant [${tenantId}]`);
    return ResponseHelper.success(updated, 'FAQ item updated successfully');
  }

  // 6. Delete FAQ item
  async remove(id: string, tenantId?: string) {
    if (!tenantId) {
      throw new ConflictException('Tenant could not be resolved from authenticated user.');
    }

    const existing = await this.prisma.faqItem.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      throw new NotFoundException(`FAQ item with ID ${id}`);
    }

    await this.prisma.faqItem.delete({
      where: { id },
    });

    this.logger.log(`Deleted FAQ item [${id}] for tenant [${tenantId}]`);
    return ResponseHelper.noContent('FAQ item deleted successfully');
  }
}
