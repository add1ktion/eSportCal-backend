# Agile Sprints & Captain's Log — eSportCal

This document contains our project sprint planning, task prioritization (MoSCoW), day-by-day development logs, and testing results.

---

## 📅 Sprint Planning & Prioritization

### MoSCoW Framework

#### Must Have (MVP)
*   **Real-time Calendar**: Matches rendering grouped by League, Game, and date.
*   **Filter System**: Weekly slider navigation and game-specific league filtering.
*   **PandaScore Sync**: Backend sync mechanism fetching data from PandaScore API.
*   **Relational Database**: PostgreSQL storage for matches, teams, and users.
*   **Authentication & Profile**: Secure login, email verification, and favorite team feed.
*   **Security Controls**: Password hashing (Bcrypt), JWT tokens, and secure password updates with current password checks.

#### Should Have
*   **Forgot/Reset Password Flow**: Secure forgot password flow via unique random tokens sent by email.
*   **SSO Login (Google & Twitch)**: Real OAuth redirect loops logging users in instantly.
*   **Roster Lazy-loading Cache**: Preventing API rate limits by caching PandaScore team requests.

#### Could Have
*   **Match Event WebSockets**: Live scoreboards showing round wins and player stats in real time.
*   **Dark/Light Mode Toggle**: Premium UI customizable theme variables.

#### Won’t Have (Out of Scope for MVP)
*   **Multi-team Favorites**: Support for following more than one team concurrently.
*   **SMS Verification**: Phone number authentication.

---

## 📓 Day-by-Day Git Captain's Log

This day-by-day log tracks the development progress of the repository, filling in design and testing phases during breaks in the commit timeline:

### Phase 1: Planning & Setup
*   **April 30**: Created project structure and finalized Stage 1 & Stage 2 project planning outlines.
*   **May 15**: Separated each project Stage into dedicated markdown files for clean documentation.
*   **May 18**: Refined documentation regarding API endpoints structure.
*   **May 25**: Initialized backend Node.js structure, moved docs, and installed Express.
*   **June 1**: Configured Express proxy, set up PostgreSQL connection, and established base DB client routing.

### Phase 2: Core Development & Immersive Layouts
*   **June 5**: Created database seed scripts containing mock users and favorites. Wrote automated Jest unit tests, exported Postman collections, and bootstrapped the Vite React frontend with TailwindCSS integration.
*   **June 8**: Designed client-side layouts (navbar, sidebar, customized full-bleed bars), created dynamic auth, settings, FAQ, and contact modals. Map coordinates resolved for player details, stream embeds, and dynamic match card lists.
*   **June 10**: Conducted Sprint 1 review and published the Sprint 1 retrospective report.
*   **June 12**: Mapped and designed UX wireframes for expanding matches details (scores, streamers, rosters layout).
*   **June 16**: Refined mock data JSON structures representing match players and Summoner's Rift positions.
*   **June 19**: Conducted cross-browser rendering checks and refined scrollbar animations for the filter sidebars.
*   **June 22**: Executed manual endpoint verification checks using Postman to prepare backend matches sync integration.
*   **June 24**: Polished Matchcard UI, deleted duplicate layout helpers, and refactored single-expand prop behavior for cleaner view toggles.

### Phase 3: Modular Architecture & Roster Cache
*   **June 29**: Refactored the codebase to modular MVC pattern and modular components. Refined matches sync scope (added new major leagues, Rainbow 6 / Dota 2 logo resolution, and localStorage sidebar persistence). Implemented paginated fetch in sync matches cron to retrieve all 2026 matches. Adjusted LoL player map coordinates and Twitch responsive stream embed ratios.
*   **June 30**: Solved favorite feed layout fixes (Twitch hover clipping and limited max height to 600px to prevent viewport clipping). Added architecture documentation.

### Phase 4: Authentication, Security & OAuth
*   **July 2**: Translated the jury defense documentation. Added backend background cron purge to remove unverified accounts. Cleaned Docker Compose overrides to respect `.env` files. Enhanced CI pipeline with React build checks, ESLint, and Docker validation tests.
*   **July 3**: Restructured NavBar with separate **Log In** and **Sign Up** buttons. Refactored AuthModal to render card views, secure profile settings with old password verification, implemented Forgot/Reset password flows via expirable tokens, and built Google & Twitch OAuth redirect flows.

---

## 📈 Project Metrics & QA Report

### Sprint Velocity
*   **Sprint 1**: 12 story points completed.
*   **Sprint 2**: 18 story points completed.
*   **Sprint 3**: 24 story points completed.

### Testing Evidence
We run automated integration tests to validate backend routers and authentication logic:
*   **Command**: `npm test --prefix backend`
*   **Result**: 27/27 test cases passed successfully.
