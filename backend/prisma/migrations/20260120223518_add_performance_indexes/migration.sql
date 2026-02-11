-- DropIndex
DROP INDEX "field_options_order_idx";

-- CreateIndex
CREATE INDEX "field_options_field_id_order_idx" ON "field_options"("field_id", "order");

-- CreateIndex
CREATE INDEX "form_fields_form_id_order_idx" ON "form_fields"("form_id", "order");

-- CreateIndex
CREATE INDEX "form_fields_form_id_is_visible_idx" ON "form_fields"("form_id", "is_visible");

-- CreateIndex
CREATE INDEX "ticket_forms_department_id_status_idx" ON "ticket_forms"("department_id", "status");

-- CreateIndex
CREATE INDEX "ticket_forms_department_id_is_default_idx" ON "ticket_forms"("department_id", "is_default");
