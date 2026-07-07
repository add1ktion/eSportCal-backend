# 📊 Sprint 1 Retrospective - eSportCal

**Sprint Period**: May 25, 2026 - June 08, 2026  
**Teammates**: Antoine & Ilan  
**Scrum Roles**: Antoine (PM / QA) | Ilan (SCM / Developer)

---

## 🎯 1. Sprint Goals & Achievements
The primary goal of Sprint 1 was to build the technical foundation of the **eSportCal** application.

- [x] **Express Backend Setup**: Successfully initialized the Node.js/Express server on port 5001.
- [x] **PandaScore API Proxy**: Built the secure proxy router `/api/matches` to fetch upcoming matches.
- [x] **Data Normalization**: Cleaned and mapped raw PandaScore payloads into compact, frontend-ready JSON.
- [x] **PostgreSQL Schema**: Successfully established a local database instance (`esportcal_db`) and executed the schema migrations for `users` and `favorites` tables.
- [x] **QA & Manual Testing**: Created and verified automated JavaScript assertions inside Postman.

*Sprint Status: 100% of planned user stories and tasks completed successfully.*

---

## 💬 2. Retrospective Analysis (What Went Well)
- **High Collaboration**: Pair-programming on complex segments (like database connection pool setups) prevented silos and improved overall code quality.
- **Pragmatic API Caching**: Implementing the proxy pattern early allowed us to bypass CORS issues and secure our private API keys inside `.env` variables.
- **Great Tooling**: Using the Antigravity/Cursor IDE and TablePlus allowed us to visualize the database structure and resolve queries instantly.

---

## ⚠️ 3. Challenges Faced & Roadblocks
- **macOS Port 5000 Conflict**: On macOS Monterey and above, port 5000 is occupied by Apple's AirPlay Receiver. This caused the Node server to exit silently without descriptive errors. 
  - *Mitigation*: We changed the local server port to `5001` in the `.env` file, resolving the conflict.
- **Missing Database Driver**: During local testing, the `pg` driver was missing from `package.json` due to a typo in dependencies.
  - *Mitigation*: Installed the missing driver (`npm install pg`) and ran code reviews to catch missing modules before pushing to the remote repository.

---

## 📈 4. Action Plan for Sprint 2
- **Enforce Branching Rigor**: We agreed to be extremely strict about Git Flow. Every single feature (no matter how small) must have its own isolated branch (e.g., `feature/*`) branched off a clean, pulled local `dev`.
- **Involve Ilan in Boilerplate Init**: To ensure equal technical ownership, Ilan will take charge of initializing the Vite/React application and configuring Tailwind CSS.
- **Automate QA Checks**: Integrate ESLint checks and our new Jest unit tests directly into the GitHub Actions CI pipeline to secure our code quality automatically on every Pull Request.