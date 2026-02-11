-- CreateTable
CREATE TABLE "ticket_user_reads" (
    "id" TEXT NOT NULL,
    "ticket_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "last_read_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_message_id" TEXT,

    CONSTRAINT "ticket_user_reads_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ticket_user_reads_user_id_idx" ON "ticket_user_reads"("user_id");

-- CreateIndex
CREATE INDEX "ticket_user_reads_ticket_id_idx" ON "ticket_user_reads"("ticket_id");

-- CreateIndex
CREATE UNIQUE INDEX "ticket_user_reads_ticket_id_user_id_key" ON "ticket_user_reads"("ticket_id", "user_id");

-- AddForeignKey
ALTER TABLE "ticket_user_reads" ADD CONSTRAINT "ticket_user_reads_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_user_reads" ADD CONSTRAINT "ticket_user_reads_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
