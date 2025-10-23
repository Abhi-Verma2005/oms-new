-- Optimize pgvector-backed tables for fast RAG
-- Usage: psql "$DATABASE_URL" -f scripts/pgvector-optimize.sql

-- Ensure pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create IVF or HNSW indexes if supported; fallback to L2 vector cosine indexes
-- Note: Adjust index names based on pgvector version and Postgres config

-- User knowledge base embedding index
DO $$
BEGIN
  -- Try HNSW (Postgres 16 / pgvector >= 0.6.0)
  BEGIN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_user_knowledge_base_embedding_hnsw ON user_knowledge_base USING hnsw (embedding vector_l2_ops)';
  EXCEPTION WHEN OTHERS THEN
    -- Fallback to L2 GIN ivfflat (older versions)
    BEGIN
      EXECUTE 'CREATE INDEX IF NOT EXISTS idx_user_knowledge_base_embedding_ivfflat ON user_knowledge_base USING ivfflat (embedding vector_l2_ops) WITH (lists = 100)';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not create HNSW/IVFFLAT index for user_knowledge_base.embedding';
    END;
  END;
END$$;

-- Semantic cache embedding index
DO $$
BEGIN
  BEGIN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_semantic_cache_query_embedding_hnsw ON semantic_cache USING hnsw (query_embedding vector_l2_ops)';
  EXCEPTION WHEN OTHERS THEN
    BEGIN
      EXECUTE 'CREATE INDEX IF NOT EXISTS idx_semantic_cache_query_embedding_ivfflat ON semantic_cache USING ivfflat (query_embedding vector_l2_ops) WITH (lists = 100)';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not create HNSW/IVFFLAT index for semantic_cache.query_embedding';
    END;
  END;
END$$;

-- Helpful btree indexes
CREATE INDEX IF NOT EXISTS idx_user_knowledge_base_user_created_at ON user_knowledge_base (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_knowledge_base_content_type ON user_knowledge_base (content_type);
CREATE INDEX IF NOT EXISTS idx_semantic_cache_user_queryhash ON semantic_cache (user_id, query_hash);

-- Analyze tables for planner stats
ANALYZE user_knowledge_base;
ANALYZE semantic_cache;

-- Optional: vacuum (may take time)
-- VACUUM (VERBOSE, ANALYZE) user_knowledge_base;
-- VACUUM (VERBOSE, ANALYZE) semantic_cache;


