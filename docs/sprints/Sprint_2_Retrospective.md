# 📊 Sprint 2 Retrospective - eSportCal

**Sprint Period**: June 09, 2026 - June 22, 2026  
**Teammates**: Antoine & Ilan  

---

## 🎯 1. Sprint Goals & Achievements
The goal of Sprint 2 was to build the interactive user interface (Single Page Application) and initiate search/filters interaction as well as match details.

- [x] **Vite / React Initialization**: Created a clean and modern frontend React structure.
- [x] **Responsive Dashboard & Calendar**: Implemented a fluid layout with weekly navigation (using date-fns) and chronological match displays.
- [x] **Sidebar Filters**: Built a state-driven filtering system (`activeFilters`) to sort matches dynamically by game and league.
- [x] **Match Details (US.V4)**: Expanded match cards to show Twitch streams, Summoner's Rift map positioning, and player roles.

---

## 💬 2. Retrospective Analysis (What Went Well)
- **Fluid UI**: Using TailwindCSS alongside React resulted in an extremely reactive interface when checking/unchecking sidebar filters.
- **Visual Richness**: Integrating an interactive Summoner's Rift map to position players on their respective lanes (Top, Jungle, Mid, Bot, Support) added significant premium polish to the UI.

---

## ⚠️ 3. Challenges Faced & Roadblocks
- **Summoner's Rift Map Alignment**: Player avatars shifted or went out of bounds when the browser was resized.
  - *Mitigation*: Used absolute percentage positioning (`top` / `left`) relative to a parent container set to `relative`, ensuring fully responsive alignments.
- **"TBD" or Empty Roles (PandaScore)**: PandaScore API returned abbreviated role names (`jun` for jungle, `bot` for ADC, `sup` for support) that were not recognized by our initial icon dictionary.
  - *Mitigation*: Created a normalization helper mapping function in `helpers.js` to translate and map these roles correctly.
- **Missing Player Photos**: Several players did not have profile photos returned by the PandaScore API, causing broken image icons (`404`) in the browser.
  - *Mitigation*: Added a futuristic neon placeholder avatar (`default.png`) used as an automatic fallback image.

---

## 📈 4. Action Plan for Sprint 3
- **Implement Authentication**: Connect signup and login forms to the JWT backend and database.
- **Favorites Engine**: Hook up the favorite teams list database relations and customized feed.
- **Refactoring & Optimization**: Restructure and clean up the codebase before final project closure.
