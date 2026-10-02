/*
  Warnings:

  - You are about to drop the column `website` on the `brands` table. All the data in the column will be lost.
  - You are about to drop the column `barcode` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `brandName` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `colors` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `sizes` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `subcategoryName` on the `products` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[productId,color,size]` on the table `product_variants` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "brands" DROP COLUMN "website";

-- AlterTable
ALTER TABLE "products" DROP COLUMN "barcode",
DROP COLUMN "brandName",
DROP COLUMN "colors",
DROP COLUMN "sizes",
DROP COLUMN "subcategoryName",
ADD COLUMN     "seoDescription" TEXT,
ADD COLUMN     "seoTitle" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "product_variants_productId_color_size_key" ON "product_variants"("productId", "color", "size");
