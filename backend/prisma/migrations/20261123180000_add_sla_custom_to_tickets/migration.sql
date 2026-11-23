-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'TICKET_SLA_DEADLINE_CHANGED';

-- AlterTable
ALTER TABLE "tickets" ADD COLUMN     "sla_custom" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "sla_custom_reason" TEXT;
