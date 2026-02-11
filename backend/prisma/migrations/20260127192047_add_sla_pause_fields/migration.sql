-- AlterTable
ALTER TABLE "tickets" ADD COLUMN     "sla_paused_at" TIMESTAMP(3),
ADD COLUMN     "sla_total_paused_minutes" INTEGER NOT NULL DEFAULT 0;
