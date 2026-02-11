/*
  Warnings:

  - You are about to drop the column `created_by` on the `departments` table. All the data in the column will be lost.
  - You are about to drop the `form_fields` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `forms` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[name]` on the table `departments` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "departments" DROP CONSTRAINT "departments_created_by_fkey";

-- DropForeignKey
ALTER TABLE "form_fields" DROP CONSTRAINT "form_fields_field_type_id_fkey";

-- DropForeignKey
ALTER TABLE "form_fields" DROP CONSTRAINT "form_fields_form_id_fkey";

-- AlterTable
ALTER TABLE "departments" DROP COLUMN "created_by",
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true;

-- DropTable
DROP TABLE "form_fields";

-- DropTable
DROP TABLE "forms";

-- CreateTable
CREATE TABLE "department_sla" (
    "id" TEXT NOT NULL,
    "department_id" TEXT NOT NULL,
    "sla_configuration_id" TEXT NOT NULL,
    "priority" "SLAPriority" NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "department_sla_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_DepartmentCreator" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_DepartmentCreator_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "department_sla_department_id_priority_key" ON "department_sla"("department_id", "priority");

-- CreateIndex
CREATE INDEX "_DepartmentCreator_B_index" ON "_DepartmentCreator"("B");

-- CreateIndex
CREATE UNIQUE INDEX "departments_name_key" ON "departments"("name");

-- AddForeignKey
ALTER TABLE "department_sla" ADD CONSTRAINT "department_sla_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "department_sla" ADD CONSTRAINT "department_sla_sla_configuration_id_fkey" FOREIGN KEY ("sla_configuration_id") REFERENCES "sla_configurations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DepartmentCreator" ADD CONSTRAINT "_DepartmentCreator_A_fkey" FOREIGN KEY ("A") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DepartmentCreator" ADD CONSTRAINT "_DepartmentCreator_B_fkey" FOREIGN KEY ("B") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
