-- CreateEnum
CREATE TYPE "DeliverableStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "departments" ADD COLUMN     "max_deliverable_rejections" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "require_deliverable" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "tickets" ADD COLUMN     "deliverable_rejections" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "ticket_deliverables" (
    "id" TEXT NOT NULL,
    "ticket_id" TEXT NOT NULL,
    "uploaded_by_id" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "file_type" TEXT NOT NULL,
    "status" "DeliverableStatus" NOT NULL DEFAULT 'PENDING',
    "rejection_reason" TEXT,
    "reviewed_by_id" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ticket_deliverables_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ticket_deliverables_ticket_id_idx" ON "ticket_deliverables"("ticket_id");

-- CreateIndex
CREATE INDEX "ticket_deliverables_uploaded_by_id_idx" ON "ticket_deliverables"("uploaded_by_id");

-- CreateIndex
CREATE INDEX "ticket_deliverables_status_idx" ON "ticket_deliverables"("status");

-- CreateIndex
CREATE INDEX "ticket_deliverables_ticket_id_status_idx" ON "ticket_deliverables"("ticket_id", "status");

-- AddForeignKey
ALTER TABLE "ticket_deliverables" ADD CONSTRAINT "ticket_deliverables_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_deliverables" ADD CONSTRAINT "ticket_deliverables_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_deliverables" ADD CONSTRAINT "ticket_deliverables_reviewed_by_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
