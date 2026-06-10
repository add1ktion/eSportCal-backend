-- =====================================================================
-- 💾 eSportCal Database Schema
-- =====================================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Users ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username      VARCHAR(50)  NOT NULL UNIQUE,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT         NOT NULL,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ─── Favorite Teams ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS favorite_teams (
    id                  SERIAL PRIMARY KEY,
    user_id             UUID    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    pandascore_team_id  INTEGER NOT NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, pandascore_team_id)
);

-- ─── Favorite Leagues ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS favorite_leagues (
    id                    SERIAL PRIMARY KEY,
    user_id               UUID    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    pandascore_league_id  INTEGER NOT NULL,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, pandascore_league_id)
);
