/*
  Warnings:

  - You are about to drop the column `department_id` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `department_role` on the `users` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_department_id_fkey";

-- DropIndex
DROP INDEX "users_department_id_idx";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "department_id",
DROP COLUMN "department_role";
