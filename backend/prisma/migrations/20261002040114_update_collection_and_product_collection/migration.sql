/*
  Warnings:

  - The `rule` column on the `collections` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "collections" ADD COLUMN     "endsAt" TIMESTAMP(3),
ADD COLUMN     "isFeatured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "order" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "seoDescription" TEXT,
ADD COLUMN     "seoTitle" TEXT,
ADD COLUMN     "startsAt" TIMESTAMP(3),
DROP COLUMN "rule",
ADD COLUMN     "rule" JSONB;

-- AlterTable
ALTER TABLE "product_collections" ADD COLUMN     "position" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "collections_tenantId_isActive_deletedAt_idx" ON "collections"("tenantId", "isActive", "deletedAt");
