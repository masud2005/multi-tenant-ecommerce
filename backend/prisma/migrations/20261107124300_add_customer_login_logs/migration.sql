-- CreateTable
CREATE TABLE "customer_login_logs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_login_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "customer_login_logs_tenantId_createdAt_idx" ON "customer_login_logs"("tenantId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "customer_login_logs_tenantId_userId_idx" ON "customer_login_logs"("tenantId", "userId");

-- CreateIndex
CREATE INDEX "customer_login_logs_tenantId_email_idx" ON "customer_login_logs"("tenantId", "email");

-- AddForeignKey
ALTER TABLE "customer_login_logs" ADD CONSTRAINT "customer_login_logs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_login_logs" ADD CONSTRAINT "customer_login_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
