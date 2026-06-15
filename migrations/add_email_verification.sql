-- Migration : ajout des colonnes pour la vérification d'email
-- À exécuter une seule fois sur ta base PostgreSQL

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS verification_token TEXT,
  ADD COLUMN IF NOT EXISTS verification_token_expires_at TIMESTAMPTZ;

-- Index pour accélérer la recherche par token
CREATE INDEX IF NOT EXISTS idx_users_verification_token ON users(verification_token);
