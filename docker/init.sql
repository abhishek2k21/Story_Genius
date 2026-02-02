-- Story-Genius Database Initialization Script
-- This script runs when the PostgreSQL container is first created

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create custom types
CREATE TYPE user_plan_tier AS ENUM ('free', 'creator', 'professional', 'enterprise');
CREATE TYPE generation_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'cancelled');
CREATE TYPE asset_type AS ENUM ('image', 'video', 'audio', 'thumbnail', 'subtitle');
CREATE TYPE video_quality AS ENUM ('draft', 'standard', 'high', 'ultra', 'cinema');

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO storygenius;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO storygenius;
GRANT USAGE ON SCHEMA public TO storygenius;

-- Log initialization
DO $$
BEGIN
  RAISE NOTICE 'Story-Genius database initialized successfully!';
  RAISE NOTICE 'Extensions enabled: uuid-ossp, vector, pg_trgm';
END $$;
