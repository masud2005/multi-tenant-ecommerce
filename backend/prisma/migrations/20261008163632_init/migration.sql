-- CreateTable
CREATE TABLE "search_query_logs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "term" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "results" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "lastSearchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "search_query_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "search_query_logs_tenantId_count_idx" ON "search_query_logs"("tenantId", "count" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "search_query_logs_tenantId_term_key" ON "search_query_logs"("tenantId", "term");

-- AddForeignKey
ALTER TABLE "search_query_logs" ADD CONSTRAINT "search_query_logs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
