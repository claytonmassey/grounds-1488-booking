-- CreateTable
CREATE TABLE "BlockedDate" (
    "id" TEXT NOT NULL,
    "spaceSlug" "SpaceSlug",
    "startDate" TEXT NOT NULL,
    "endDate" TEXT NOT NULL,
    "reason" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BlockedDate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BlockedDate_startDate_endDate_idx" ON "BlockedDate"("startDate", "endDate");
