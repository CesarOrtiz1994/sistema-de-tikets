-- AlterTable
ALTER TABLE "ticket_messages" ADD COLUMN     "reply_to_id" TEXT;

-- CreateIndex
CREATE INDEX "ticket_messages_reply_to_id_idx" ON "ticket_messages"("reply_to_id");

-- AddForeignKey
ALTER TABLE "ticket_messages" ADD CONSTRAINT "ticket_messages_reply_to_id_fkey" FOREIGN KEY ("reply_to_id") REFERENCES "ticket_messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;
