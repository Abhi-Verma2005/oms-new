-- Safe Performance Indexes for AI Chat System
-- These indexes will improve query performance without data loss

-- Index for user_knowledge_base user_id and created_at queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_knowledge_base_user_created 
ON user_knowledge_base(user_id, created_at DESC);

-- Index for content type filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_knowledge_base_user_content_type 
ON user_knowledge_base(user_id, content_type);

-- Index for semantic cache queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_semantic_cache_user_query 
ON semantic_cache(user_id, query_hash);

-- Index for cache expiration
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_semantic_cache_expires 
ON semantic_cache(expires_at);

-- Index for RAG performance metrics
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rag_performance_user_timestamp 
ON rag_performance_metrics(user_id, timestamp DESC);

-- Index for user interactions
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_interactions_user_timestamp 
ON user_interactions(user_id, timestamp DESC);

-- Index for chat sessions
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_sessions_user_active 
ON chat_sessions(user_id, is_active, last_message_at DESC);


