-- CreateTable
CREATE TABLE "tenant_roles" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "permissions" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_roles_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "tenant_members" DROP COLUMN IF EXISTS "role",
DROP COLUMN IF EXISTS "customRole",
DROP COLUMN IF EXISTS "permissions",
ADD COLUMN "roleId" TEXT,
ADD COLUMN "isOwner" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "inviteToken" TEXT,
ADD COLUMN "inviteExpiresAt" TIMESTAMP(3);

-- DropEnum
DROP TYPE IF EXISTS "TenantMemberRole";

-- CreateIndex
CREATE INDEX "tenant_roles_tenantId_idx" ON "tenant_roles"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_roles_tenantId_name_key" ON "tenant_roles"("tenantId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_members_inviteToken_key" ON "tenant_members"("inviteToken");

-- AddForeignKey
ALTER TABLE "tenant_roles" ADD CONSTRAINT "tenant_roles_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_members" ADD CONSTRAINT "tenant_members_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "tenant_roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
