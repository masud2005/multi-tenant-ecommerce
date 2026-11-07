import { PrismaService } from '../../prisma/prisma.service';
import { ReviewStatus } from '../../../prisma/generated/client';

/**
 * Recompute Product.rating + Product.reviewCount from PUBLISHED reviews only.
 */
export async function syncProductReviewAggregates(
  prisma: PrismaService,
  productId: string,
): Promise<{ rating: number; reviewCount: number }> {
  const published = await prisma.review.findMany({
    where: {
      productId,
      status: ReviewStatus.PUBLISHED,
      deletedAt: null,
    },
    select: { rating: true },
  });

  const reviewCount = published.length;
  const rating =
    reviewCount > 0
      ? Number(
          (
            published.reduce((sum, row) => sum + row.rating, 0) / reviewCount
          ).toFixed(2),
        )
      : 0;

  await prisma.product.update({
    where: { id: productId },
    data: { rating, reviewCount },
  });

  return { rating, reviewCount };
}
