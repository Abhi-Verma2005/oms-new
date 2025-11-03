-- Manual migration: Add csv_rows table
-- Run this SQL directly on your database if Prisma migrate fails

CREATE TABLE IF NOT EXISTS "csv_rows" (
    "id" TEXT NOT NULL,
    "document_id" TEXT NOT NULL,
    "row_index" INTEGER NOT NULL,
    "data" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "csv_rows_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "csv_rows_document_id_row_index_idx" ON "csv_rows"("document_id", "row_index");

ALTER TABLE "csv_rows" ADD CONSTRAINT "csv_rows_document_id_fkey" 
    FOREIGN KEY ("document_id") REFERENCES "user_documents"("id") 
    ON DELETE CASCADE ON UPDATE CASCADE;

