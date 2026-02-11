-- CreateTable
CREATE TABLE "department_ticket_access" (
    "id" TEXT NOT NULL,
    "department_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "department_ticket_access_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "department_ticket_access_department_id_user_id_key" ON "department_ticket_access"("department_id", "user_id");

-- AddForeignKey
ALTER TABLE "department_ticket_access" ADD CONSTRAINT "department_ticket_access_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "department_ticket_access" ADD CONSTRAINT "department_ticket_access_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
