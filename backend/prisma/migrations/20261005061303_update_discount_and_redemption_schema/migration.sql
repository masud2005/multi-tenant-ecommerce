-- AlterTable
ALTER TABLE "discounts" ADD COLUMN     "maxDiscountAmount" DECIMAL(12,2),
ADD COLUMN     "usageLimitPerUser" INTEGER DEFAULT 1;

-- CreateTable
CREATE TABLE "discount_redemptions" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "discountId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "userId" TEXT,
    "customerEmail" TEXT,
    "discountedAmount" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "discount_redemptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "discount_redemptions_tenantId_discountId_idx" ON "discount_redemptions"("tenantId", "discountId");

-- CreateIndex
CREATE INDEX "discount_redemptions_discountId_userId_idx" ON "discount_redemptions"("discountId", "userId");

-- CreateIndex
CREATE INDEX "discount_redemptions_discountId_customerEmail_idx" ON "discount_redemptions"("discountId", "customerEmail");

-- AddForeignKey
ALTER TABLE "discount_redemptions" ADD CONSTRAINT "discount_redemptions_discountId_fkey" FOREIGN KEY ("discountId") REFERENCES "discounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discount_redemptions" ADD CONSTRAINT "discount_redemptions_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
