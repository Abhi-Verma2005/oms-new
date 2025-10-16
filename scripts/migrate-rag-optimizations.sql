-- RAG System Optimization Migration
-- Run this directly on your database to add RAG optimizations

-- Enable pgvector extension if not already enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- ✅ HNSW index for vector similarity search (blazing fast)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_interaction_embeddings_hnsw 
ON user_interaction_embeddings 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- ✅ GIN index for full-text search (hybrid search support)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_interaction_embeddings_fulltext 
ON user_interaction_embeddings 
USING gin(to_tsvector('english', content));

-- ✅ Composite indexes for user-specific queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_interaction_embeddings_user_timestamp 
ON user_interaction_embeddings(user_id, timestamp DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_interaction_embeddings_user_content_type 
ON user_interaction_embeddings(user_id, "contentType");

-- ✅ Metadata JSONB index for filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_interaction_embeddings_metadata 
ON user_interaction_embeddings USING gin(metadata);

-- ✅ Topics array index for topic-based filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_interaction_embeddings_topics 
ON user_interaction_embeddings USING gin(topics);

-- ✅ Optimize user_interactions table
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_interactions_user_timestamp 
ON user_interactions(user_id, timestamp DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_interactions_type_timestamp 
ON user_interactions(interaction_type, timestamp DESC);

-- ✅ Add importance score for better ranking
ALTER TABLE user_interaction_embeddings 
ADD COLUMN IF NOT EXISTS importance_score FLOAT DEFAULT 1.0;

-- ✅ Add access tracking for cache optimization
ALTER TABLE user_interaction_embeddings 
ADD COLUMN IF NOT EXISTS access_count INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_accessed TIMESTAMP DEFAULT NOW();

-- ✅ Create semantic cache table
CREATE TABLE IF NOT EXISTS semantic_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Query info
  query_hash VARCHAR(64) NOT NULL,
  query_embedding vector(1536) NOT NULL,
  
  -- Cache data
  cached_response JSONB NOT NULL,
  context_data JSONB,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '30 minutes'),
  hit_count INT DEFAULT 0,
  last_hit TIMESTAMP,
  
  UNIQUE(user_id, query_hash)
);

-- ✅ Indexes for semantic cache
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_semantic_cache_user ON semantic_cache(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_semantic_cache_embedding ON semantic_cache USING hnsw(query_embedding vector_cosine_ops);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_semantic_cache_expires ON semantic_cache(expires_at);

-- ✅ Performance monitoring table
CREATE TABLE IF NOT EXISTS rag_performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Metrics
  operation VARCHAR(50) NOT NULL,
  duration_ms INT NOT NULL,
  success BOOLEAN NOT NULL,
  
  -- Context
  query_length INT,
  context_length INT,
  docs_retrieved INT,
  docs_final INT,
  
  -- Timestamps
  timestamp TIMESTAMP DEFAULT NOW(),
  
  -- Metadata
  metadata JSONB DEFAULT '{}'
);

-- ✅ Index for performance metrics
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rag_metrics_timestamp ON rag_performance_metrics(timestamp DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rag_metrics_operation ON rag_performance_metrics(operation, timestamp DESC);

-- ✅ Clean up old cache entries function
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM semantic_cache WHERE expires_at < NOW();
  DELETE FROM rag_performance_metrics WHERE timestamp < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- ✅ Update access metrics function
CREATE OR REPLACE FUNCTION update_access_metrics(record_ids UUID[])
RETURNS void AS $$
BEGIN
  UPDATE user_interaction_embeddings
  SET 
    last_accessed = NOW(),
    access_count = access_count + 1
  WHERE id = ANY(record_ids);
END;
$$ LANGUAGE plpgsql;

-- ✅ Create unified knowledge base table (alternative to existing tables)
CREATE TABLE IF NOT EXISTS user_knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Content
  content TEXT NOT NULL,
  content_type VARCHAR(50) NOT NULL DEFAULT 'conversation',
  
  -- Embeddings
  embedding vector(1536),
  sparse_embedding tsvector GENERATED ALWAYS AS (to_tsvector('english', content)) STORED,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  topics TEXT[] DEFAULT '{}',
  sentiment VARCHAR(20),
  intent VARCHAR(50),
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_accessed TIMESTAMP DEFAULT NOW(),
  access_count INT DEFAULT 0,
  
  -- Relevance scoring
  importance_score FLOAT DEFAULT 1.0,
  
  CONSTRAINT valid_content_type CHECK (
    content_type IN ('conversation', 'document', 'preference', 'feedback', 'memory')
  )
);

-- ✅ Indexes for unified knowledge base
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_knowledge_user ON user_knowledge_base(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_knowledge_hnsw ON user_knowledge_base USING hnsw(embedding vector_cosine_ops);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_knowledge_fulltext ON user_knowledge_base USING gin(sparse_embedding);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_knowledge_metadata ON user_knowledge_base USING gin(metadata);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_knowledge_topics ON user_knowledge_base USING gin(topics);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_knowledge_type_timestamp ON user_knowledge_base(content_type, created_at DESC);

-- ✅ Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_knowledge_base_updated_at
  BEFORE UPDATE ON user_knowledge_base
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ✅ Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON user_knowledge_base TO postgres;
GRANT SELECT, INSERT, UPDATE, DELETE ON semantic_cache TO postgres;
GRANT SELECT, INSERT ON rag_performance_metrics TO postgres;
GRANT EXECUTE ON FUNCTION cleanup_expired_cache() TO postgres;
GRANT EXECUTE ON FUNCTION update_access_metrics(UUID[]) TO postgres;

-- ✅ Verify installation
SELECT 'RAG System Optimizations Installed Successfully!' as status;
