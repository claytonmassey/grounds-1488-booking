-- AlterEnum
ALTER TYPE "SpaceSlug" ADD VALUE 'SEASONAL_SETS';

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "seasonalSetId" TEXT;

-- CreateTable
CREATE TABLE "SeasonalSet" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "imageUrl" TEXT NOT NULL,
    "imageAlt" TEXT NOT NULL DEFAULT '',
    "hourlyRate" INTEGER NOT NULL,
    "maxCapacity" INTEGER NOT NULL DEFAULT 1,
    "openHour" INTEGER NOT NULL DEFAULT 8,
    "closeHour" INTEGER NOT NULL DEFAULT 20,
    "availableFrom" TEXT NOT NULL,
    "availableTo" TEXT NOT NULL,
    "purposes" JSONB NOT NULL DEFAULT '["PHOTOGRAPHY"]',
    "published" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SeasonalSet_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SeasonalSet_slug_key" ON "SeasonalSet"("slug");

-- CreateIndex
CREATE INDEX "SeasonalSet_published_sortOrder_idx" ON "SeasonalSet"("published", "sortOrder");

-- CreateIndex
CREATE INDEX "SeasonalSet_availableFrom_availableTo_idx" ON "SeasonalSet"("availableFrom", "availableTo");

-- CreateIndex
CREATE INDEX "Booking_seasonalSetId_bookingDate_status_idx" ON "Booking"("seasonalSetId", "bookingDate", "status");

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_seasonalSetId_fkey" FOREIGN KEY ("seasonalSetId") REFERENCES "SeasonalSet"("id") ON DELETE SET NULL ON UPDATE CASCADE;
