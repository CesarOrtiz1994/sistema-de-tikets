-- CreateTable
CREATE TABLE "ticket_deliverable_files" (
    "id" TEXT NOT NULL,
    "deliverable_id" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "file_type" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ticket_deliverable_files_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ticket_deliverable_files_deliverable_id_idx" ON "ticket_deliverable_files"("deliverable_id");

-- AddForeignKey
ALTER TABLE "ticket_deliverable_files" ADD CONSTRAINT "ticket_deliverable_files_deliverable_id_fkey" FOREIGN KEY ("deliverable_id") REFERENCES "ticket_deliverables"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: cada entregable existente pasa a tener su archivo en la nueva tabla
INSERT INTO "ticket_deliverable_files" ("id", "deliverable_id", "file_url", "file_name", "file_size", "file_type", "created_at")
SELECT gen_random_uuid()::text, "id", "file_url", "file_name", "file_size", "file_type", "created_at"
FROM "ticket_deliverables";
