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

-- ─── Matches Cache ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS matches (
    id                INTEGER PRIMARY KEY,
    name              VARCHAR(255) NOT NULL,
    status            VARCHAR(50) NOT NULL,
    scheduled_at      TIMESTAMPTZ NOT NULL,
    game_name         VARCHAR(100),
    game_slug         VARCHAR(100),
    league_name       VARCHAR(100),
    league_image      TEXT,
    serie_name        VARCHAR(100),
    stage_name        VARCHAR(100),
    number_of_games   INTEGER,
    match_type        VARCHAR(50),
    stream_url        TEXT,
    teams             JSONB,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Teams Cache ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS teams_cache (
    id            INTEGER PRIMARY KEY,
    name          VARCHAR(255) NOT NULL,
    image_url     TEXT,
    players       JSONB,
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
