-- USERS
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username      VARCHAR(30) UNIQUE NOT NULL,
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  avatar_url    TEXT,
  bio           TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- BOARDS (categorías)
CREATE TABLE boards (
  id          SERIAL PRIMARY KEY,
  slug        VARCHAR(10) UNIQUE NOT NULL,
  name        VARCHAR(50) NOT NULL,
  description TEXT,
  post_count  INTEGER DEFAULT 0
);

-- POSTS
CREATE TABLE posts (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id         INTEGER REFERENCES boards(id) ON DELETE CASCADE,
  user_id          UUID REFERENCES users(id) ON DELETE SET NULL,
  anonymous_id     VARCHAR(20),
  title            VARCHAR(200) NOT NULL,
  content          TEXT,
  image_url        TEXT,
  image_public_id  TEXT,
  vote_score       INTEGER DEFAULT 0,
  comment_count    INTEGER DEFAULT 0,
  is_pinned        BOOLEAN DEFAULT FALSE,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT post_has_content CHECK (content IS NOT NULL OR image_url IS NOT NULL)
);

-- COMMENTS
CREATE TABLE comments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id      UUID REFERENCES posts(id) ON DELETE CASCADE,
  parent_id    UUID REFERENCES comments(id) ON DELETE CASCADE,
  user_id      UUID REFERENCES users(id) ON DELETE SET NULL,
  anonymous_id VARCHAR(20),
  content      TEXT NOT NULL,
  vote_score   INTEGER DEFAULT 0,
  depth        INTEGER DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- VOTES
CREATE TABLE votes (
  id           SERIAL PRIMARY KEY,
  user_id      UUID REFERENCES users(id) ON DELETE CASCADE,
  anonymous_id VARCHAR(20),
  post_id      UUID REFERENCES posts(id) ON DELETE CASCADE,
  comment_id   UUID REFERENCES comments(id) ON DELETE CASCADE,
  value        SMALLINT NOT NULL CHECK (value IN (-1, 1)),
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT one_vote_per_post    UNIQUE (user_id, post_id),
  CONSTRAINT one_vote_per_comment UNIQUE (user_id, comment_id),
  CONSTRAINT vote_target_check    CHECK (
    (post_id IS NOT NULL AND comment_id IS NULL) OR
    (post_id IS NULL AND comment_id IS NOT NULL)
  )
);

-- INDEXES
CREATE INDEX idx_posts_board_id   ON posts(board_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_posts_vote_score ON posts(vote_score DESC);
CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_comments_parent  ON comments(parent_id);
CREATE INDEX idx_votes_post       ON votes(post_id);

-- Auto-actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Boards iniciales
INSERT INTO boards (slug, name, description) VALUES
  ('tech',   '/tech/',   'Technology, programming, hardware'),
  ('art',    '/art/',    'Digital art, design, aesthetics'),
  ('random', '/b/',      'Anything goes. Be creative.'),
  ('feels',  '/feels/',  'Vent. Reflect. Disappear.');