-- AlterTable
ALTER TABLE "notification_templates" ADD COLUMN IF NOT EXISTS "key" TEXT;
ALTER TABLE "notification_templates" ADD COLUMN IF NOT EXISTS "description" TEXT;
ALTER TABLE "notification_templates" ADD COLUMN IF NOT EXISTS "inAppTitle" TEXT;
ALTER TABLE "notification_templates" ADD COLUMN IF NOT EXISTS "inAppMessage" TEXT;
ALTER TABLE "notification_templates" ADD COLUMN IF NOT EXISTS "variables" JSONB;

-- Backfill key for any legacy rows (stable unique per row until seed replaces)
UPDATE "notification_templates"
SET "key" = COALESCE(NULLIF("key", ''), "id")
WHERE "key" IS NULL OR "key" = '';

ALTER TABLE "notification_templates" ALTER COLUMN "key" SET NOT NULL;

-- DropIndex
DROP INDEX IF EXISTS "notification_templates_tenantId_event_key";

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "notification_templates_tenantId_key_key" ON "notification_templates"("tenantId", "key");
CREATE INDEX IF NOT EXISTS "notification_templates_tenantId_group_idx" ON "notification_templates"("tenantId", "group");
