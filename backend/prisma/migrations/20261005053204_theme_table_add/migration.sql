-- CreateEnum
CREATE TYPE "ThemeStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "theme_presets" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "previewImage" TEXT,
    "defaultTokens" JSONB NOT NULL,
    "defaultSections" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "theme_presets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_themes" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "presetId" TEXT,
    "name" TEXT NOT NULL,
    "status" "ThemeStatus" NOT NULL DEFAULT 'DRAFT',
    "isLive" BOOLEAN NOT NULL DEFAULT false,
    "primaryColor" TEXT NOT NULL DEFAULT '#B5562F',
    "secondaryColor" TEXT DEFAULT '#2E3A67',
    "accentColor" TEXT NOT NULL DEFAULT '#5C6B4E',
    "canvasColor" TEXT NOT NULL DEFAULT '#F7F4EF',
    "surfaceColor" TEXT NOT NULL DEFAULT '#FFFFFF',
    "inkColor" TEXT NOT NULL DEFAULT '#1C1A17',
    "fontHeading" TEXT NOT NULL DEFAULT 'Fraunces',
    "fontBody" TEXT NOT NULL DEFAULT 'Inter',
    "borderRadius" TEXT NOT NULL DEFAULT '0.5rem',
    "cardStyle" TEXT NOT NULL DEFAULT 'portrait-hover',
    "customCss" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3),

    CONSTRAINT "tenant_themes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "theme_sections" (
    "id" TEXT NOT NULL,
    "themeId" TEXT NOT NULL,
    "sectionType" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "settings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "theme_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "theme_versions" (
    "id" TEXT NOT NULL,
    "themeId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "label" TEXT,
    "snapshot" JSONB NOT NULL,
    "publishedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "theme_versions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "theme_presets_slug_key" ON "theme_presets"("slug");

-- CreateIndex
CREATE INDEX "tenant_themes_tenantId_isLive_idx" ON "tenant_themes"("tenantId", "isLive");

-- CreateIndex
CREATE INDEX "theme_sections_themeId_orderIndex_idx" ON "theme_sections"("themeId", "orderIndex");

-- CreateIndex
CREATE INDEX "theme_versions_themeId_idx" ON "theme_versions"("themeId");

-- AddForeignKey
ALTER TABLE "tenant_themes" ADD CONSTRAINT "tenant_themes_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_themes" ADD CONSTRAINT "tenant_themes_presetId_fkey" FOREIGN KEY ("presetId") REFERENCES "theme_presets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "theme_sections" ADD CONSTRAINT "theme_sections_themeId_fkey" FOREIGN KEY ("themeId") REFERENCES "tenant_themes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "theme_versions" ADD CONSTRAINT "theme_versions_themeId_fkey" FOREIGN KEY ("themeId") REFERENCES "tenant_themes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
