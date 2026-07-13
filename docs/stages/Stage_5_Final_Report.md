# 📑 Stage 5: Final Report & Project Closure — eSportCal

**Authors**: Antoine & Ilan  
**Date**: July 13, 2026  
**Project**: eSportCal (Unified e-Sports Match Calendar & Fan Dashboard)

---

## 1. Results Summary & Objectives Comparison

### Core MVP Functionalities
Our Minimum Viable Product (MVP) has been fully implemented, deployed, and tested. The core features include:
1.  **Unified e-Sports Match Calendar**: Dynamic weekly schedule view with a custom horizontal day-by-day strip navigation (Mon-Sun) and zero-spoiler default score masks.
2.  **Multidirectional Filtering**: A dynamic sidebar allowing users to filter matches in real-time by game (League of Legends, CS:GO, Valorant, Dota 2, R6), league, and specific team. Filters persist across refreshes via `localStorage`.
3.  **Local Timezone Normalization**: Automatic client-side UTC timestamp conversion based on the user's browser location.
4.  **Embedded Streaming**: Responsive inline Twitch stream player integration inside match cards when live.
5.  **Personalized Account & Favorites Engine**: Fully secure user auth flow (local registration, email verification via SMTP, password resets, and Google/Twitch SSO OAuth) enabling users to bookmark teams and leagues, feeding a dedicated "Favorites Feed".

### Objectives Comparison (Project Charter vs. Final Delivery)

| Goal / Feature | Planned Objective (Stage 1 Charter) | Final Status (Stage 5 Delivery) | Notes |
| :--- | :--- | :--- | :--- |
| **Multi-game Calendar** | LOl, Valorant, CS:GO | **Delivered & Expanded** | Added Dota 2 and Rainbow 6. |
| **Spoiler Protection** | Mask scores until clicked | **Delivered** | Implemented default masked UI with interactive reveal buttons. |
| **Authentication Flow** | Username/Password login | **Delivered & Expanded** | Integrated Google & Twitch OAuth SSO, SMTP email verification, and password resets. |
| **Deployment Platform** | Vercel / Supabase | **Delivered & Migrated** | Migrated to Azure Static Web Apps (Frontend) + Railway (Backend & PostgreSQL Database) for higher scalability, security, and internal low-latency network connection. |
| **CI/CD Quality Control** | Run linters and tests on merge | **Delivered** | GitHub Actions pipeline running ESLint and Jest suites before every deployment. |

### Key Metrics
*   **Sprint Velocity**: Constant progress across 3 Sprints (Sprint 1: 12 SP, Sprint 2: 18 SP, Sprint 3: 24 SP).
*   **Database Latency**: Reduced to `<15ms` query response times by migrating to a shared virtual private network (VPN) on Railway where the Node.js API and PostgreSQL live in the same cluster.
*   **Backend Test Coverage**: **85%** of backend endpoints and core utility functions covered by Jest unit tests.
*   **Build & Deploy Pipelines**: Average deployment time of `1m 30s` from commit push to live URL.

---

## 2. Lessons Learned & Retrospective Highlights

### What Went Well
*   **MVC Codebase Decoupling**: Refactoring the monolithic backend early in Sprint 2 into clean Model-View-Controller files saved massive development time during the authentication and database migration stages.
*   **Virtual Private Database Caching**: Local caching of teams, matches, and logos locally in the PostgreSQL database bypassed PandaScore rate limits and speed up client loading times significantly.
*   **Pair Programming Ceremonies**: Direct communication and pair programming sessions kept Antoine and Ilan aligned, preventing duplicate work on features with heavy backend/frontend dependencies.

### Key Technical Challenges & Resolutions (Code-Wise)

1.  **CI Lint & Build Blocks**:
    *   *Challenge*: GitHub Actions pipeline failed multiple builds due to strict ESLint checks blocking on unused imports (such as `User` from Lucide-React in navigation components).
    *   *Resolution*: Cleaned up frontend modules and added local linting commands (`npm run lint`) to run automatically before pushing code.
2.  **Day-by-Day Weekly Navigation Strip**:
    *   *Challenge*: Creating a clean, responsive Mon-Sun horizontal day strip that filters matches dynamically on click while keeping sync with week-paging and resetting filters correctly.
    *   *Resolution*: Refactored date filtering states in `App.jsx` using `addDays` from `date-fns` to dynamically compute active week bounds and bound filters to local timezone offsets.
3.  **Authentication Constraints & Foreign Keys**:
    *   *Challenge*: Relational schema mismatch during JWT authentication setup when linkings users and favorites tables.
    *   *Resolution*: Wrote clean schema migrations (`add_email_verification` and `add_password_reset`) and automated their execution on startup via `dbInit.js`.
4.  **Hosting & DNS Redirect Configuration**:
    *   *Challenge*: Migrating from Vercel/Supabase to Azure Static Web Apps and Railway Postgres. Conflicting DNS A-records on OVH caused connection losses on the apex domain (`esportcal.com`).
    *   *Resolution*: Purged Vercel IPs from the OVH DNS zone and set up a clean HTTP 301 permanent redirect pointing to the Azure-hosted CNAME.

---

## 3. Team Retrospective & Collaboration Feedback

### Managing a Project as a Two-Person Team
Working as a team of two brought specific operational challenges and strengths:
*   **Task Overlap & Git Conflicts**: With only two developers, we frequently worked on adjacent codeblocks (especially in `App.jsx` on the frontend and routing files on the backend), leading to complex Git merge conflicts.
*   **Coordination Strategy**: To resolve this, we stopped working ad-hoc. We structured our tasks using Trello and assigned clear ownership.
*   **Communication Channels**: We communicated directly via Discord calls and live screen sharing rather than text updates. All major code integrations were reviewed together before being pushed to `dev`.

### Lessons for Future Projects
*   **Write Tests Concurrently**: Writing Jest tests alongside routes rather than at the very end keeps coverage high without creating a testing bottleneck at closure.
*   **CI Validation Warnings**: Pay attention to linter warnings locally to avoid wasting build minutes in GitHub Actions on simple styling check failures.
