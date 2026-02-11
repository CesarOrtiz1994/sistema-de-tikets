-- AlterTable
ALTER TABLE "tickets" ADD COLUMN     "created_outside_business_hours" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "sla_start_time" TIMESTAMP(3);
