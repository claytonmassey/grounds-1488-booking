-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "cancelSource" TEXT,
ADD COLUMN     "cancelledAt" TIMESTAMP(3),
ADD COLUMN     "penaltyAmountCents" INTEGER,
ADD COLUMN     "refundAmountCents" INTEGER,
ADD COLUMN     "stripeRefundId" TEXT;

-- AlterTable
ALTER TABLE "SiteSettings" ADD COLUMN     "cancellationPolicy" JSONB NOT NULL DEFAULT '{}';
