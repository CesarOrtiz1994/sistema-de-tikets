-- CreateEnum
CREATE TYPE "FieldCategory" AS ENUM ('TEXT', 'NUMBER', 'SELECTION', 'DATE', 'FILE', 'ADVANCED');

-- CreateEnum
CREATE TYPE "ValidationType" AS ENUM ('REQUIRED', 'MIN_LENGTH', 'MAX_LENGTH', 'MIN_VALUE', 'MAX_VALUE', 'PATTERN', 'EMAIL', 'URL', 'PHONE', 'CUSTOM');

-- CreateEnum
CREATE TYPE "SLAPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateTable
CREATE TABLE "field_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "category" "FieldCategory" NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "hasOptions" BOOLEAN NOT NULL DEFAULT false,
    "allowMultiple" BOOLEAN NOT NULL DEFAULT false,
    "hasPlaceholder" BOOLEAN NOT NULL DEFAULT true,
    "hasDefaultValue" BOOLEAN NOT NULL DEFAULT true,
    "availableValidations" JSONB,
    "componentType" TEXT NOT NULL,
    "inputProps" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "field_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "validation_rules_catalog" (
    "id" TEXT NOT NULL,
    "type" "ValidationType" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "requiresValue" BOOLEAN NOT NULL DEFAULT false,
    "valueType" TEXT,
    "default_error_message" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "validation_rules_catalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sla_configurations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "priority" "SLAPriority" NOT NULL DEFAULT 'MEDIUM',
    "response_time" INTEGER NOT NULL,
    "resolution_time" INTEGER NOT NULL,
    "escalation_enabled" BOOLEAN NOT NULL DEFAULT false,
    "escalation_time" INTEGER,
    "business_hours_only" BOOLEAN NOT NULL DEFAULT true,
    "notify_on_breach" BOOLEAN NOT NULL DEFAULT true,
    "notify_before" INTEGER DEFAULT 30,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sla_configurations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "forms" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "department_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "requires_auth" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "forms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "form_fields" (
    "id" TEXT NOT NULL,
    "form_id" TEXT NOT NULL,
    "field_type_id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "placeholder" TEXT,
    "help_text" TEXT,
    "default_value" TEXT,
    "is_required" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "width" TEXT NOT NULL DEFAULT 'full',
    "options" JSONB,
    "validations" JSONB,
    "conditional" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "form_fields_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "field_types_name_key" ON "field_types"("name");

-- CreateIndex
CREATE UNIQUE INDEX "validation_rules_catalog_type_key" ON "validation_rules_catalog"("type");

-- CreateIndex
CREATE UNIQUE INDEX "sla_configurations_name_key" ON "sla_configurations"("name");

-- CreateIndex
CREATE INDEX "form_fields_form_id_idx" ON "form_fields"("form_id");

-- CreateIndex
CREATE INDEX "form_fields_field_type_id_idx" ON "form_fields"("field_type_id");

-- AddForeignKey
ALTER TABLE "form_fields" ADD CONSTRAINT "form_fields_form_id_fkey" FOREIGN KEY ("form_id") REFERENCES "forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_fields" ADD CONSTRAINT "form_fields_field_type_id_fkey" FOREIGN KEY ("field_type_id") REFERENCES "field_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
