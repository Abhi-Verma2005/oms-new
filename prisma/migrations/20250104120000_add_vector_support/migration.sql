-- AlterTable
ALTER TABLE "user_interaction_embeddings" ALTER COLUMN "embedding" TYPE vector(1536) USING embedding::vector(1536);
