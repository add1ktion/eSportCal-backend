# 📊 Sprint 3 Retrospective - eSportCal

**Sprint Period**: June 23, 2026 - July 07, 2026  
**Teammates**: Antoine & Ilan  

---

## 🎯 1. Sprint Goals & Achievements
This final execution sprint focused on data persistence, security, and final codebase polishing (professional refactoring).

- [x] **Secure Authentication (JWT & Bcrypt)**: Completed registration and login flows with password hashing and email verification.
- [x] **Favorites Engine & Custom Feed**: Persisted favorite teams in PostgreSQL database, built a custom vertically scrollable feed limited to a 2-match height, which expands dynamically.
- [x] **Anti-Spoiler Score Masking**: Added a "Reveal" button to hide scores for finished/running matches.
- [x] **Exclusive Card Expansion**: Restructured card states so that expanding one match card automatically collapses others, keeping the view clean.
- [x] **MVC Backend Refactoring**: Cleaned up the monolithic `app.js` into separated routes, controllers, and services. Centralized tests under `backend/tests/`.
- [x] **Targeted Sync Whitelist**: Refined the sync cron task to only pull and store whitelisted major leagues since January 1st, 2026, and automatically purge non-matching matches from PostgreSQL.
- [x] **Persisted Sidebar Filters**: Saved and restored sidebar filter selections automatically using `localStorage`.

---

## 💬 2. Retrospective Analysis (What Went Well)
- **High-Quality Code Architecture**: Migrating to a clean, modular MVC structure ensures the application is production-ready and easily maintainable.
- **Database & Query Optimization**: Filtering leagues before insertion and purging outdated entries reduced database size by over 70%, significantly speeding up calendar query response times.

---

## ⚠️ 3. Challenges Faced & Roadblocks
- **Monolithic Code & Scattered Tests**: Too much business logic was stored directly in `app.js`, and Jest tests were split across duplicate directories.
  - *Mitigation*: Carried out a structural refactoring on a dedicated branch before final merge.
- **Missing/Broken League Logos (`?`)**: Acronym mismatches (e.g. `International.png` vs `The_International.png`) caused some sidebar items to show a fallback question mark.
  - *Mitigation*: Audited asset folders and renamed files to match exact keys expected by the React rendering code.
- **Resetting Sidebar Filters**: User sidebar choices were lost upon page refresh or relogging.
  - *Mitigation*: Implemented a React side-effect synchronized with browser `localStorage` to persist sidebar filters.

---

## 📈 4. Action Plan for Project Closure (Stage 5)
- **Production Deployment**: Configure and deploy the Docker containers on a VPS/NAS production host.
- **Demos & Deliverables**: Record the walkthrough video showcasing the UI flows and prepare the final presentation slides.
