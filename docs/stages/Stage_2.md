# 📑 Stage 2: Project Planning

## 0. Project Charter Overview
The objective of this stage is to establish a clear roadmap for **eSportCal**. By outlining our timeline and milestones, we ensure that both team members (Antoine & Ilan) stay aligned on goals and deadlines throughout the development process.

---

## 1. High-Level Project Plan (Timeline)
We have mapped out the project over a 12-week period, ensuring enough time for technical research, development, and final testing.

| Phase | Duration | Dates |
| :--- | :--- | :--- |
| **Stage 1: Idea Dev** | 2 weeks | Apr 20 - May 01 |
| **Stage 2: Planning** | 2 weeks | Apr 20 - May 01 |
| **Stage 3: Tech Doc** | 2 weeks | May 04 - May 17 |
| **Stage 4: MVP Dev** | 6 weeks | May 25 - Jul 07 |
| **Stage 5: Closure** | 2 weeks | Jul 08 - Jul 21 |

---

## 2. Detailed Milestone Breakdown

### 🏗️ Stage 3: Technical Documentation
* **Goal**: Create the "blueprint" of the application.
* **Key Tasks**: 
    * Design the Database Schema (PostgreSQL tables: Users, Teams, Favorites).
    * Map out the Backend API routes (Node.js/Express).
    * Create UI Mockups for the Dashboard and Login pages.

---

### 📈 Stage 4: Execution & Agile Planning

To ensure a user-centric approach, we defined our features through **User Stories** and estimated the development effort using **Poker Planning** (Fibonacci scale: 1, 2, 3, 5, 8, 13).

#### 👤 The User Stories
*   **US.V1 (Schedule)**: As a visitor, I want to see a chronological list of upcoming matches.
*   **US.V2 (Multi-Filters)**: As a visitor, I want to filter matches by games, leagues, and specific teams.
*   **US.V3 (Timezone)**: As a visitor, I want match times to automatically adjust to my local timezone.
*   **US.V4 (Match Details)**: As a visitor, I want to click on a match to see extra details (e.g., Best of 3, Twitch stream link).
*   **US.U1 (Authentication)**: As a user, I want to sign up, log in, and log out securely.
*   **US.U2 (Account Mgmt)**: As a user, I want to change my password or delete my account (GDPR compliance).
*   **US.U3 (Favorites Engine)**: As a user, I want to bookmark my favorite games, leagues, and teams.
*   **US.U4 (Custom Feed)**: As a user, I want a dedicated feed for my favorites and visual indicators on the main schedule.

#### 🃏 Poker Planning & Estimation

| Story ID | Feature Description | Complexity | Priority |
| :--- | :--- | :---: | :---: |
| **US.V1** | Fetch & Display Data (PandaScore to React) | **5** | Must-Have |
| **US.V2** | Build Frontend UI & API Filtering Logic | **5** | Must-Have |
| **US.V3** | Timezone logic implementation | **3** | Must-Have |
| **US.V4** | Expandable match details (Stream links) | **2** | Should-Have |
| **US.U1** | Auth System (JWT, Bcrypt, Postgres setup) | **8** | Must-Have |
| **US.U2** | Profile update & Account deletion | **3** | Must-Have |
| **US.U3** | Many-to-Many DB mapping for Favorites | **8** | Must-Have |
| **US.U4** | Custom filtered view & UI highlights | **5** | Should-Have |

#### 🚀 Development Sprints (6 Weeks / May 25 - Jul 07)
*   **Sprint 1 (May 25 - Jun 08) - The Foundation (11 Points)**: 
    * *Tasks*: Backend setup, Database initialization, and PandaScore API connection. 
    * *Target*: **US.V1** (5) & **US.V3** (3), plus Boilerplate (3).
*   **Sprint 2 (Jun 09 - Jun 22) - UI & Interaction (12 Points)**: 
    * *Tasks*: Frontend structure, Dashboard layout, Calendar display, and Filtering logic. 
    * *Target*: **US.V2** (5), **US.V4** (2), and Dashboard layout (3). Start Frontend part of **US.U1**.
*   **Sprint 3 (Jun 23 - Jul 07) - Persistence & Polish (19 Points)**: 
    * *Tasks*: Completing Authentication, implementing the Favorites database relation, and customizing the user feed. 
    * *Target*: **US.U1** (8), **US.U2** (3), **US.U3** (8). *(Note: High point load; US.U2 or Custom Feed will be dropped if time runs out).*

---

### 📦 Stage 5: Project Closure
* **Goal**: Finalize and present the project.
* **Key Tasks**:
    * Final deployment of the application (Docker/VPS/NAS).
    * Creating the video demo and presentation slides.
    * Post-project reflection and documentation update.

---

## 3. Collaboration Strategy
* **Daily Sync**: A 10-minute "Stand-up" every morning at 10:00 AM to track progress and unblock any issues.
* **Task Management**: We use a shared **Trello Board** to move tasks from "To-Do" to "Done".
* **Peer Review**: Every piece of code is reviewed by both Antoine and Ilan before being merged into the main project.
