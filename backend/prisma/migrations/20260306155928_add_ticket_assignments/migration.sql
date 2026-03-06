/*
  Warnings:

  - You are about to drop the column `assigned_to_id` on the `tickets` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "tickets" DROP CONSTRAINT "tickets_assigned_to_id_fkey";

-- DropIndex
DROP INDEX "tickets_assigned_to_id_idx";

-- DropIndex
DROP INDEX "tickets_assigned_to_id_status_idx";

-- AlterTable
ALTER TABLE "tickets" DROP COLUMN "assigned_to_id";

-- CreateTable
CREATE TABLE "ticket_assignments" (
    "id" TEXT NOT NULL,
    "ticket_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assigned_by" TEXT,

    CONSTRAINT "ticket_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ticket_assignments_ticket_id_idx" ON "ticket_assignments"("ticket_id");

-- CreateIndex
CREATE INDEX "ticket_assignments_user_id_idx" ON "ticket_assignments"("user_id");

-- CreateIndex
CREATE INDEX "ticket_assignments_user_id_ticket_id_idx" ON "ticket_assignments"("user_id", "ticket_id");

-- CreateIndex
CREATE UNIQUE INDEX "ticket_assignments_ticket_id_user_id_key" ON "ticket_assignments"("ticket_id", "user_id");

-- AddForeignKey
ALTER TABLE "ticket_assignments" ADD CONSTRAINT "ticket_assignments_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_assignments" ADD CONSTRAINT "ticket_assignments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
