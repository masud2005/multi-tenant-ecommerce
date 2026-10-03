/*
  Warnings:

  - The values [TRANSFER_IN,TRANSFER_OUT] on the enum `StockMovementReason` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "StockMovementReason_new" AS ENUM ('RECEIVED', 'ORDER', 'CORRECTION', 'DAMAGED', 'LOST_STOLEN', 'PHYSICAL_COUNT', 'RETURN');
ALTER TABLE "stock_movements" ALTER COLUMN "reason" TYPE "StockMovementReason_new" USING ("reason"::text::"StockMovementReason_new");
ALTER TYPE "StockMovementReason" RENAME TO "StockMovementReason_old";
ALTER TYPE "StockMovementReason_new" RENAME TO "StockMovementReason";
DROP TYPE "public"."StockMovementReason_old";
COMMIT;

-- AlterTable
ALTER TABLE "product_variants" ADD COLUMN     "lowStockThreshold" INTEGER DEFAULT 5;

-- AlterTable
ALTER TABLE "stock_movements" ADD COLUMN     "note" TEXT,
ADD COLUMN     "stockAfter" INTEGER,
ADD COLUMN     "stockBefore" INTEGER;
