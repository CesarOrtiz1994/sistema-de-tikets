-- AlterTable
ALTER TABLE "form_fields" ADD COLUMN     "column_in_row" INTEGER DEFAULT 0,
ADD COLUMN     "column_span" INTEGER DEFAULT 1,
ADD COLUMN     "row" INTEGER DEFAULT 0;
