/*
  Warnings:

  - You are about to drop the column `subcategoriesList` on the `categories` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[tenantId,parentId,name]` on the table `categories` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "categories" DROP COLUMN "subcategoriesList";

-- CreateIndex
CREATE UNIQUE INDEX "categories_tenantId_parentId_name_key" ON "categories"("tenantId", "parentId", "name");
