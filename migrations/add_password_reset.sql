-- Migration: adding columns for password resets
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS reset_token TEXT,
  ADD COLUMN IF NOT EXISTS reset_token_expires_at TIMESTAMPTZ;

-- Index to optimize search by reset token
CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users(reset_token);
