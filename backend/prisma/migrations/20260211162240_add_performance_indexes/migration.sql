-- CreateIndex
CREATE INDEX "tickets_requester_id_status_idx" ON "tickets"("requester_id", "status");

-- CreateIndex
CREATE INDEX "tickets_sla_exceeded_idx" ON "tickets"("sla_exceeded");

-- CreateIndex
CREATE INDEX "tickets_deleted_at_idx" ON "tickets"("deleted_at");

-- CreateIndex
CREATE INDEX "tickets_department_id_created_at_idx" ON "tickets"("department_id", "created_at");

-- CreateIndex
CREATE INDEX "tickets_status_resolved_at_idx" ON "tickets"("status", "resolved_at");
