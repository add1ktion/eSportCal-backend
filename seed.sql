-- =====================================================================
-- 💾 eSportCal Database Seed Script
-- =====================================================================
-- This script populates the database with mock data for development.
-- It resets the tables and inserts a test user with pre-defined favorites.
--
-- Plaintext Password for the test user is: "password123"
-- =====================================================================

-- 1. Clean up existing test data (CASCADE automatically clears foreign key dependencies)
TRUNCATE TABLE favorite_teams, favorite_leagues, users CASCADE;

-- 2. Insert Mock Users and link their Favorites dynamically
-- We use a CTE (WITH ... AS) to capture the auto-generated UUID of the user
WITH inserted_user_1 AS (
    INSERT INTO users (username, email, password_hash, is_verified)
    VALUES (
        'esport_fan_99', 
        'fan@esportcal.com', 
        '$2b$10$686hE0YDMZtLP5JQdwL0KeLHP2i.E06aQeGf3gNgpKbqk83jnE84.', -- Bcrypt hash of 'password123'
        TRUE
    )
    RETURNING id
),
inserted_user_2 AS (
    INSERT INTO users (username, email, password_hash, is_verified)
    VALUES (
        'cs2_enjoyer', 
        'gamer@esportcal.com', 
        '$2b$10$686hE0YDMZtLP5JQdwL0KeLHP2i.E06aQeGf3gNgpKbqk83jnE84.', -- Bcrypt hash of 'password123'
        TRUE
    )
    RETURNING id
),
inserted_teams AS (
    INSERT INTO favorite_teams (user_id, pandascore_team_id)
    SELECT id, 126738 FROM inserted_user_1
    UNION ALL
    SELECT id, 135321 FROM inserted_user_1
    UNION ALL
    SELECT id, 126738 FROM inserted_user_2
)
-- 4. Insert Favorite Leagues for our users
-- League ID 5232 = CCT Europe
INSERT INTO favorite_leagues (user_id, pandascore_league_id)
SELECT id, 5232 FROM inserted_user_1;