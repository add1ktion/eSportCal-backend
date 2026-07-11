# 🎓 eSportCal — DemoDay Presentation & Q&A Guide

This guide is designed to help you ace your **10-minute DemoDay presentation** and the subsequent **10-minute Q&A session** with the jury. The entire guide is written in English to match your evaluation requirements.

---

## ⏱️ Part 1: 10-Minute Presentation Script

Here is a minute-by-minute walkthrough with slide suggestions, visual actions, and your spoken script.

### Slide 1: Title Slide (0:00 - 1:00)
*   **Slide Content**: Project Logo, "eSportCal - The Ultimate Multi-Game eSports Calendar", Your Names, Date.
*   **Your Action**: Stand confident, make eye contact, and introduce yourself.
*   **Spoken Script**:
    > "Good morning everyone. Today, my partner Ilan and I are thrilled to present **eSportCal**, a platform built to solve a major problem for millions of eSports fans worldwide. eSports is growing exponentially, but following your favorite teams is currently a fragmented and frustrating experience. Fans have to jump between Liquipedia, HLTV, Twitter, and various streaming sites just to know when a match is scheduled. If they check late, they get spoiled by the final scores on social media. eSportCal centralizes everything in one premium, customized, and anti-spoiler dashboard."

### Slide 2: The Core Solution & Features (1:00 - 2:30)
*   **Slide Content**: Key features list (Multi-game integration, time-zone alignment, anti-spoiler filter, custom favorites, seamless social authentication).
*   **Your Action**: Highlight the user-centric features.
*   **Spoken Script**:
    > "To address these pain points, we developed a modern web application with three key pillars:
    > 1. **Centralization**: We support five major competitive games—League of Legends, Counter-Strike 2, Valorant, Dota 2, and Rainbow Six Siege.
    > 2. **User Experience**: Match times automatically align with the user's local timezone, and we implemented an active 'anti-spoiler' feature that masks match results until clicked.
    > 3. **Personalization**: Users can log in using Google or Twitch to build a customized feed containing only their bookmarked teams."

### Slide 3: Live Demonstration (2:30 - 5:30)
*   **Slide Content / Screen**: Share screen showing the active frontend running on production (`esportcal.com`).
*   **Your Action**: Perform a live walkthrough of the app.
*   **Spoken Script**:
    > "Let's dive into the live application.
    > As you can see, the homepage displays a dark, high-contrast, premium interface. 
    > 
    > *   *Action: Toggle filters.* First, I can filter matches by game. If I only want to see Valorant and CS2 matches, I click these filter pills, and the calendar updates instantly without any page reload.
    > *   *Action: Click a week tab.* I can navigate through different weeks to see upcoming schedules.
    > *   *Action: Show a finished match.* For completed matches, the score is hidden. If I click 'Reveal Score', the actual result appears. This is our anti-spoiler system.
    > *   *Action: Click Login -> Authenticate with Google/Twitch.* Now, let's log in. We integrated official Google and Twitch OAuth2 flows. With one click, I am securely logged in.
    > *   *Action: Add a team to favorites.* I can now bookmark my favorite teams, like Karmine Corp or Team Vitality. Immediately, my calendar highlights their matches, creating a tailored feed.
    > *   *Action: Click a match to expand team detail.* If I click on a match card, it expands to show the active team rosters, loading players dynamically."

### Slide 4: Technical Architecture & Data Flow (5:30 - 7:00)
*   **Slide Content**: System Architecture Diagram (React/Vite -> Node/Express -> Supabase PostgreSQL -> PandaScore API / Grafana Cloud / Sentry).
*   **Your Action**: Explain the architectural choices.
*   **Spoken Script**:
    > "Behind this seamless user experience lies a robust **decoupled client-server architecture**.
    > On the frontend, we chose **React with Vite** for lightning-fast builds and rendering. The layout is built using modern CSS and Tailwind.
    > On the backend, we built a **Node.js and Express API** structured around the **MVC (Model-View-Controller)** pattern.
    > For the database, we chose **PostgreSQL** hosted on **Supabase**. We leverage Postgres's native **JSONB** data type to store structured rosters and team data directly in tables, avoiding expensive database joins and improving fetch speeds."

### Slide 5: API Integration & Local Caching Strategy (7:00 - 8:30)
*   **Slide Content**: Caching Mechanism (Cache Hit vs. Cache Miss flow), Background Cron Sync details.
*   **Your Action**: Explain the caching logic.
*   **Spoken Script**:
    > "A major challenge we faced was API limits. The external PandaScore API restricts requests. 
    > To handle this, we implemented a **local caching strategy**:
    > *   Every 15 minutes, a background **Cron Job** on our backend synchronizes schedules from PandaScore and updates our PostgreSQL database.
    > *   When a user visits our app, we load data from our database—not the external API. This ensures sub-10ms response times and keeps us well under API limits.
    > *   For player rosters, we use **Lazy Loading**. The backend checks the local cache. If it is a 'Cache Miss', it fetches the roster from PandaScore once, writes it to the local cache, and returns it. Future requests get a 'Cache Hit' directly from the DB."

### Slide 6: DevOps, CI/CD, & Observability (8:30 - 9:30)
*   **Slide Content**: GitHub Actions workflow (Postgres testing container, npm audit, linting, Docker build validation) & Grafana Dashboard.
*   **Your Action**: Discuss security and production monitoring.
*   **Spoken Script**:
    > "As software engineers, we prioritised code quality, security, and production safety.
    > *   **CI/CD Pipeline**: Built with GitHub Actions. On every pull request, it spawns a test PostgreSQL container, runs a suite of integration tests using **Jest and Supertest**, checks dependencies for high-security vulnerabilities using `npm audit`, and validates the production Docker build.
    > *   **Observability**: We connected the backend to **Grafana Cloud** (using Prometheus for performance metrics and Loki for logs) and **Sentry** for real-time error tracking. If a database query fails or a connection is lost, we are alerted immediately."

### Slide 7: Conclusion & Q&A (9:30 - 10:00)
*   **Slide Content**: "Thank You - Questions?", GitHub Repositories link.
*   **Your Action**: Thank the audience and open the floor.
*   **Spoken Script**:
    > "To conclude, eSportCal successfully bridges the gap between raw eSports data and a premium, personalized user interface, all while maintaining a secure, monitored, and highly scalable production architecture. Thank you for your time, and we are now ready for your questions."

---

## 💬 Part 2: Q&A Cheat Sheet (Top Expected Questions)

Here are the most likely questions the jury will ask, along with professional engineering answers.

### Q1: Why did you choose a SQL database (PostgreSQL) instead of a NoSQL database (MongoDB) since you store team arrays and rosters?
*   **Jury Intent**: Checking if you blindly chose PostgreSQL or understand relational constraints.
*   **Your Answer**: 
    > "We chose PostgreSQL because our core business logic relies on strong relational integrity. We have a strict relation between `users` and their `favorite_teams` or `favorite_leagues`. Using a relational database ensures foreign key constraints, like `ON DELETE CASCADE`. If a user deletes their account, all their favorites are immediately and automatically deleted, which is critical for GDPR compliance. For unstructured data like rosters or team details, PostgreSQL's native **JSONB** type allows us to store and query JSON documents efficiently without sacrificing relational safety."

### Q2: How do you secure user authentication, and how does the backend know if a request is authenticated?
*   **Jury Intent**: Evaluating your understanding of stateless JWT authentication and middlewares.
*   **Your Answer**:
    > "We implement **JWT (JSON Web Token) stateless authentication**. When a user registers or logs in, the backend hashes the password using `bcrypt` (with a salt factor of 10) and signs a token with a secret key (`JWT_SECRET`) that expires in 7 days. For protected endpoints like managing favorites, the frontend sends this token in the `Authorization: Bearer <token>` HTTP header. An Express middleware intercepts the request, calls `jwt.verify()`, and injects the decoded payload (`req.user`) into the request context. If the token is missing or invalid, the middleware blocks the request with a `401 Unauthorized` or `403 Forbidden` status."

### Q3: You mentioned a Cron Job. What happens if the API sync script fails or times out in production?
*   **Jury Intent**: Assessing error handling and system resilience.
*   **Your Answer**:
    > "The synchronization script is designed with resilience in mind. All network calls to PandaScore are wrapped in `try-catch` blocks. If an API call fails or times out, the error is caught, logged to **Grafana Loki** as an error severity level, and reported to **Sentry**. However, the application itself does not crash; our users can still navigate the calendar because we continue to serve the cached matches from our PostgreSQL database. Once the next cron cycle runs 15 minutes later, it attempts to sync again."

### Q4: How does your frontend handle responsiveness and state synchronization?
*   **Jury Intent**: Verifying React state-management concepts.
*   **Your Answer**:
    > "We use React hooks like `useState` to manage local UI states, such as active week filters and the spoiler toggle. To keep filters persistent across page refreshes, we synchronize the selection with the browser's `LocalStorage`. We fetch match data inside a `useEffect` hook, which list the active filters in its dependency array. Whenever a user changes a filter, the hook automatically triggers a fetch request to the backend, ensuring the UI remains perfectly synchronized with the server state."

### Q5: How would you scale this application if the user base grows from 100 to 100,000 active users?
*   **Jury Intent**: Testing your architectural vision and scalability knowledge.
*   **Your Answer**:
    > "To scale the application, we would implement two major changes:
    > 1. **Cache Layer**: Introduce a **Redis cache** in front of PostgreSQL. Common queries like retrieving the current week's matches would be served directly from memory, reducing database load and response times to under 10ms.
    > 2. **Database Partitioning**: As the `matches` table grows, we would partition it by month or year. This ensures PostgreSQL only scans index ranges for the relevant active week instead of the entire table history."

### Q6: Why did you disable batching in your Loki logging transport (`batching: false`)?
*   **Jury Intent**: Verifying your understanding of the logging pipeline we just fixed.
*   **Your Answer**:
    > "In production containers, low log volumes combined with container restarts can cause buffered logs to stay in memory for a long time or get lost when a container stops. By setting `batching: false` in our Winston Loki transport, we force the logger to send every log entry immediately via an HTTP POST request. This ensures real-time reactive monitoring on our Grafana dashboard and prevents log loss during deployments."
