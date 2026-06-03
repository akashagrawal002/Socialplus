-- ============================================================
-- SocialPulse AI — Database Schema
-- Run this file to create all tables
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- USERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name     VARCHAR(255) NOT NULL,
  avatar_url    TEXT,
  plan          VARCHAR(20) DEFAULT 'free' CHECK (plan IN ('free','pro','agency')),
  ai_credits    INTEGER DEFAULT 50,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);

CREATE INDEX idx_users_email ON users(email);

-- ============================================================
-- WORKSPACES (one user can have multiple brands)
-- ============================================================
CREATE TABLE IF NOT EXISTS workspaces (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name          VARCHAR(255) NOT NULL,
  business_name VARCHAR(255),
  industry      VARCHAR(255),
  niche         TEXT,
  target_audience TEXT,
  primary_platform VARCHAR(50),
  location      VARCHAR(255),
  logo_url      TEXT,
  brand_voice   TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_workspaces_user_id ON workspaces(user_id);

-- ============================================================
-- COMPETITORS
-- ============================================================
CREATE TABLE IF NOT EXISTS competitors (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name            VARCHAR(255) NOT NULL,
  handle          VARCHAR(255),
  platform        VARCHAR(50),
  industry        VARCHAR(255),
  notes           TEXT,
  analysis_data   JSONB,
  is_auto_detected BOOLEAN DEFAULT FALSE,
  last_analyzed_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_competitors_workspace_id ON competitors(workspace_id);

-- ============================================================
-- CONTENT GENERATIONS (history)
-- ============================================================
CREATE TABLE IF NOT EXISTS content_generations (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id  UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type          VARCHAR(100) NOT NULL,
  -- e.g. 'reel_ideas', 'post', 'script', 'hooks', 'competitor_analysis', 'trends', 'news'
  platform      VARCHAR(50),
  topic         TEXT,
  prompt_used   TEXT,
  result        TEXT NOT NULL,
  tokens_used   INTEGER DEFAULT 0,
  is_saved      BOOLEAN DEFAULT FALSE,
  is_favorited  BOOLEAN DEFAULT FALSE,
  tags          TEXT[],
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_generations_workspace_id ON content_generations(workspace_id);
CREATE INDEX idx_generations_user_id ON content_generations(user_id);
CREATE INDEX idx_generations_type ON content_generations(type);
CREATE INDEX idx_generations_created ON content_generations(created_at DESC);

-- ============================================================
-- SAVED CONTENT (curated saves from generations)
-- ============================================================
CREATE TABLE IF NOT EXISTS saved_content (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  generation_id   UUID REFERENCES content_generations(id) ON DELETE SET NULL,
  title           VARCHAR(500),
  content         TEXT NOT NULL,
  content_type    VARCHAR(100),
  platform        VARCHAR(50),
  status          VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft','scheduled','published')),
  scheduled_at    TIMESTAMPTZ,
  published_at    TIMESTAMPTZ,
  tags            TEXT[],
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_saved_workspace_id ON saved_content(workspace_id);
CREATE INDEX idx_saved_status ON saved_content(status);

-- ============================================================
-- TRENDS CACHE (cached trend data to avoid duplicate API calls)
-- ============================================================
CREATE TABLE IF NOT EXISTS trends_cache (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cache_key   VARCHAR(500) UNIQUE NOT NULL,
  niche       VARCHAR(255),
  platform    VARCHAR(50),
  trend_type  VARCHAR(50),
  data        TEXT NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_trends_cache_key ON trends_cache(cache_key);
CREATE INDEX idx_trends_expires ON trends_cache(expires_at);

-- ============================================================
-- NEWS CACHE
-- ============================================================
CREATE TABLE IF NOT EXISTS news_cache (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cache_key   VARCHAR(500) UNIQUE NOT NULL,
  platform    VARCHAR(50),
  topic       VARCHAR(255),
  news_type   VARCHAR(50),
  data        TEXT NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_news_cache_key ON news_cache(cache_key);

-- ============================================================
-- AI USAGE TRACKING (per user rate limiting)
-- ============================================================
CREATE TABLE IF NOT EXISTS ai_usage_log (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action      VARCHAR(100) NOT NULL,
  tokens_used INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ai_usage_user_id ON ai_usage_log(user_id);
CREATE INDEX idx_ai_usage_created ON ai_usage_log(created_at DESC);

-- ============================================================
-- AUTO-UPDATE updated_at ON ROW CHANGE
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workspaces_updated_at BEFORE UPDATE ON workspaces
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_competitors_updated_at BEFORE UPDATE ON competitors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_saved_content_updated_at BEFORE UPDATE ON saved_content
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- SEED: Default demo workspace (optional, for testing)
-- ============================================================
-- INSERT INTO users (email, password_hash, full_name, plan, ai_credits)
-- VALUES ('demo@socialpulse.ai', '$2b$10$example_hash', 'Demo User', 'pro', 500);
