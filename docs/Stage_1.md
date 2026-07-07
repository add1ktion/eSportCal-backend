# 📑 Stage 1: Team Formation, Brainstorming and MVP

## 👤 Team, Vision & Norms
- **Project Name** : eSportCal.
- **Team** : Antoine & Ilan.
- **Roles** : Unlike traditional structures, we have decided not to assign fixed technical roles (e.g., dedicated Frontend vs. Backend). Instead, we will operate on a Full-Stack & Peer-Programming model. As aspiring DevOps engineers, we believe it is crucial for both members to master every layers of the application. This ensures better redundancy, shared technical knowledge, and a deeper understanding of the integration challenges between the frontend and the database.
- **Collaboration Tools** :
    - Discord: For daily syncs and instant communication.
    - GitHub: For version control (using Pull Requests to review each other's code).
    - Trello: For task management and tracking progress.
- **Objective** : Develop a website that regroups all e-sport matches worldwide.
- **Team Norms** : Daily stand-ups at 10:00 AM

---

## 🛠️ Technical Stack & Strategic Decisions

| Element | Decision | Technical Justification |
| :--- | :--- | :--- |
| **Platform** | **Web (Desktop-first)** | Focus on the "second-screen" experience for gamers. Web ensures instant deployment and maximum accessibility for the MVP. |
| **Frontend** | **React.js (via Vite.js)** | Modern SPA architecture. Vite provides a fast development cycle, essential for building the dashboard within the 4-week window. |
| **Backend (API)** | **Node.js & Express** | We will build our **own REST API** to handle business logic, process data from PandaScore, and manage secure communication with the database. |
| **Database** | **PostgreSQL** | A robust relational database to manage user profiles, team favorites, and cached match data for performance and persistence. |
| **Data Source** | **PandaScore API** | External industry-standard API used as our primary data source for professional schedules and team metadata. |
| **Styling** | **Tailwind CSS** | Utility-first CSS framework to ensure a professional, consistent UI across the entire dashboard and authentication views. |
| **Philosophy** | **Full-Stack Ownership** | By building our own Backend and Database layer, we ensure full control over the system architecture, facilitating future DevOps implementations (Docker, CI/CD). |

---

## 🔍 Technical Rationale (Architecture Choice)

* **Why React instead of Vanilla JS?** Plain JavaScript is too verbose for complex filtering logic. Using React prevents "reinventing the wheel" and ensures a scalable component-based architecture.
* **Desktop-First Approach:** Our core audience primarily uses second monitors while gaming. By focusing on Desktop, we can optimize the display of large data sets (match grids and filters) before considering a future mobile port.

---

## 🧠 Brainstorming Process
We conducted a collaborative research session using the **SCAMPER framework** and **Mind Mapping** to identify recurring issues in the gaming and e-sport industry. Our goal was to find a data-driven problem that fits a 4-week development cycle.

---

## 🎯 Project Refinement (The MVP)

### 1. Problem & Solution
* **The Problem**: E-sport fans currently struggle with fragmented data. They have to juggle between multiple wikis, social media, and streams to find match times.
* **The Solution**: **eSportCal**, a unified Desktop-First Web Application that aggregates professional schedules into a single, filtered interface.

### 2. Key Features (SMART Goals)
* **Unified Schedule**: Fetch and display 100% accurate match dates using the PandaScore API.
* **Dynamic Filtering**: Enable instant sorting by game (LoL, CS2, Valorant), by league and by team using React state management.
* **User Accounts**: Provide secure login and profile customization using our custom Node.js backend and PostgreSQL database.

### 3. Project Scope
* **In-Scope**: API integration, filtering logic, SPA navigation, User Authentication (Login/Profile), and About/Contact pages.
* **Out-of-Scope**: Mobile-native application, real-time live score tickers, betting systems, or social chat features.

---

## ⚠️ Risk Management & Challenges

| Identified Risk | Mitigation Strategy |
| :--- | :--- |
| **Learning Curve** | Learning React/Vite from scratch in 4 weeks. | **Strategy**: Focus on functional components and intensive pair-programming. |
| **API Limitations** | No live scores on the free tier of PandaScore. | **Strategy**: Define the project strictly as a "Scheduling Tool" (Calendar). |
| **Time Management** | Broad scope (Login + Profile + API). | **Strategy**: Prioritize the core calendar functionality before secondary pages. |
| **Data Consistency** | Handling multiple timezones for global matches. | **Strategy**: Use libraries like `date-fns` to normalize time display to the user's local zone. |

---

## 📅 Progress Status
- [x] **Task 0**: Team Formation & Norms Definition.
- [x] **Task 1**: Research & Brainstorming.
- [x] **Task 2**: Decision & Project Refinement.
- [x] **Task 3**: Final Stage 1 Documentation.