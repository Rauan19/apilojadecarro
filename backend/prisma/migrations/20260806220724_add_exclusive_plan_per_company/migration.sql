-- AlterTable
ALTER TABLE "subscription_plans" ADD COLUMN     "companyId" TEXT;

-- CreateIndex
CREATE INDEX "subscription_plans_companyId_idx" ON "subscription_plans"("companyId");

-- AddForeignKey
ALTER TABLE "subscription_plans" ADD CONSTRAINT "subscription_plans_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
