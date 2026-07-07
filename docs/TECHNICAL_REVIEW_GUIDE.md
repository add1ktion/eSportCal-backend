# Technical Manual Review Prep Guide — eSportCal

This guide contains the detailed technical arguments, diagrams, and explanations required for Antoine and Ilan to ace the SWE Technical Manual Review.

---

## 🏛️ 1. Application Architecture

Our application is built using a clean decoupling of concerns (Client-Server Architecture) using **React (Frontend)** and **Express Node.js (Backend)**.

### Backend Structure (MVC Pattern)
We adhere to the Model-View-Controller pattern (with JSON APIs acting as the View layer):
*   **Model (`backend/db.js` & `schema.sql`)**: PostgreSQL query client wrapping SQL relations.
*   **Controller (`backend/controllers/`)**: Contains logic for matching data, syncing matches, registering favorites, and handling authentication.
*   **Routes (`backend/routes/`)**: Exposes public REST endpoints mapped to specific controllers.

### Frontend Component Tree
Our React layout is modular and responsive:
*   `App.jsx`: State hub managing active dates, filters, active user sessions, and alert overlays.
*   `NavBar.jsx`: Separate login/signup buttons and profile controls.
*   `UserSettings.jsx`: Favorite team selector and secure password inputs.
*   `AuthModal.jsx`: Segmented OAuth buttons and local account logins.
*   `MatchItem.jsx` / `MatchDetails.jsx`: Collapsible cards rendering match states and live Twitch streams.

---

## 💾 2. Database Design & Schema

We use **PostgreSQL** to persist all application data.

### Relations Diagram (ERD)
*   **`users`**: Stores user accounts. Contains username, email (unique, indexed), password_hash, verification columns, and password reset tokens.
*   **`user_favorites`**: Many-to-One mapping linking a user to a favorite team (`pandascore_team_id`).
*   **`matches`**: Local cache storing all e-sport matches synced from PandaScore (game slug, teams, date, stream URL, status, scores).
*   **`teams_cache`**: Storing team roster details (players, positions) to prevent API rate-limiting.

### Key Optimization Indexes
*   `idx_users_email` on `users(email)`: Speeds up credentials checks during login.
*   `idx_users_reset_token` on `users(reset_token)`: Speeds up reset password token lookups.
*   `idx_matches_scheduled_at` on `matches(scheduled_at)`: Speeds up weekly navigation filters.

---

## ⚡ 3. Critical Technical Decisions

### Decision A: Lazy-Loading Team details & Rate-Limit Caching
*   **Problem**: PandaScore API limits queries. Querying rosters dynamically for every match card on page load quickly depletes API quotas.
*   **Solution**: We implemented a local `teams_cache` table. When a user expands a match detail panel, the backend checks if the team's roster is cached. If it is, it serves it instantly. If not (Cache Miss), it fetches it from PandaScore, caches it, and serves it.
*   **Result**: Reduced PandaScore API calls by over 90% during active user sessions.

### Decision B: Security Implementation
*   **Hashing**: We NEVER store plain text passwords. We use `bcrypt` with `10` salt rounds to hash passwords on registration and reset.
*   **Token Authentication**: We use stateless `JSON Web Tokens (JWT)` signed with `JWT_SECRET` for secure sessions.
*   **Verification**: Accounts are flagged `is_verified = FALSE` on signup. Nodemailer SMTP sends a verification email. Unverified accounts are automatically deleted after 24 hours via a Cron-Job.

---

## 🧪 4. Testing & QA Strategy

We enforce automated and manual testing to prevent regressions:

### 1. Automated Integration Tests (Jest & Supertest)
*   We test the REST endpoints end-to-end (connecting to the test database, creating tables, checking routes, and dropping/cleaning database records).
*   **Covered Scenarios**: User registration, login verification, duplicate username checks, password reset flows, secure password settings changes, and favorite teams registration.

### 2. Manual QA Testing
*   Tested the responsive interface using responsive viewports.
*   Validated the email delivery loop using local credentials.

---

## 👥 5. Team Collaboration & SCM Best Practices

*   **Git Branching**: We protect the `dev` and `main` branches. All features are developed in isolated branches:
    *   `feature/auth-modals-and-password-reset`
    *   `feature/sso-oauth-google-twitch`
*   **Pull Request Verification**: Every PR requires a mandatory review, code quality check, and validation that backend test suites pass before merge.
