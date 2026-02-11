-- CreateTable
CREATE TABLE "department_work_schedules" (
    "id" TEXT NOT NULL,
    "department_id" TEXT NOT NULL,
    "day_of_week" INTEGER NOT NULL,
    "start_hour" INTEGER NOT NULL,
    "start_minute" INTEGER NOT NULL DEFAULT 0,
    "end_hour" INTEGER NOT NULL,
    "end_minute" INTEGER NOT NULL DEFAULT 0,
    "is_workday" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "department_work_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "department_work_schedules_department_id_idx" ON "department_work_schedules"("department_id");

-- CreateIndex
CREATE UNIQUE INDEX "department_work_schedules_department_id_day_of_week_key" ON "department_work_schedules"("department_id", "day_of_week");

-- AddForeignKey
ALTER TABLE "department_work_schedules" ADD CONSTRAINT "department_work_schedules_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
