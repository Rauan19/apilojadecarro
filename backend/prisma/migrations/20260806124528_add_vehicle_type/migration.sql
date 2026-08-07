-- CreateEnum
CREATE TYPE "VehicleType" AS ENUM ('CAR', 'MOTORCYCLE', 'TRUCK');

-- AlterTable
ALTER TABLE "vehicles" ADD COLUMN     "type" "VehicleType" NOT NULL DEFAULT 'CAR';

-- CreateIndex
CREATE INDEX "vehicles_type_idx" ON "vehicles"("type");
