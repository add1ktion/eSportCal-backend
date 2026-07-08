# 🏛️ Guide de Soutenance — Technical Manual Review (eSportCal)

Ce document rassemble toutes les explications techniques, l'architecture générale, les schémas de base de données, la logique des tests d'intégration, ainsi que les explications détaillées des extraits de code (snippets) que tu vas devoir présenter lors de ta **Manual Review**.

---

## 🧭 1. Présentation Générale (Le Pitch)
**eSportCal** est une plateforme web d'agrégation de calendriers e-sportifs multi-jeux (League of Legends, Counter-Strike 2, Valorant, Dota 2, Rainbow 6). 
*   **Problématique résolue** : Les fans d'e-sport doivent jongler entre de multiples sites (Liquipedia, HLTV, etc.) pour suivre leurs équipes. eSportCal centralise tout au même endroit, avec un filtre puissant et un calendrier interactif adapté aux fuseaux horaires.
*   **Fonctionnalités clés (MVP)** : Calendrier en temps réel, filtres avancés par ligues, masquage anti-spoiler des scores, système d'authentification sécurisé, flux personnalisé d'équipes favorites et synchronisation automatique en tâche de fond.

---

## 🏛️ 2. Architecture Technique & Choix Technologiques
Nous avons opté pour une architecture **Client-Serveur découplée** :
*   **Frontend** : Construit avec **Vite + React.js** pour une interface utilisateur (UI) dynamique, réactive et fluide. Le design est géré en CSS moderne avec Tailwind CSS pour un rendu sombre premium. Déployé sur **Vercel**.
*   **Backend** : Une API REST robuste avec **Node.js + Express** structurée selon le modèle **MVC** (Model-View-Controller). Déployé sur **Railway**.
*   **Base de Données** : **PostgreSQL** hébergé sur **Supabase** pour la fiabilité des relations SQL (indispensable pour lier les utilisateurs à leurs favoris et gérer le cache des matchs).
*   **Mailing** : Service de messagerie transactionnelle géré par **Resend**.

---

## 💾 3. Modèle Physique de Données (PostgreSQL)

Notre base de données contient 4 tables optimisées :

1.  **`users`** : Comptes des utilisateurs.
    *   *Colonnes* : `id`, `username`, `email` (unique, indexé), `password_hash`, `is_verified` (booléen), `verification_token`, `reset_token`, `reset_token_expires`, `created_at`.
2.  **`user_favorites`** : Table de liaison de type Many-to-One.
    *   *Colonnes* : `id`, `user_id` (clé étrangère liée à `users.id` avec suppression en cascade), `pandascore_team_id` (indexé).
3.  **`matches`** : Table de mise en cache locale des matchs synchronisés depuis l'API PandaScore.
    *   *Colonnes* : `id` (PandaScore ID), `game_slug`, `league_name`, `league_logo`, `scheduled_at` (indexé), `status`, `team1_name`, `team1_logo`, `team2_name`, `team2_logo`, `score_team1`, `score_team2`, `stream_url`.
4.  **`teams_cache`** : Cache local pour le Lazy-Loading des rosters d'équipes.
    *   *Colonnes* : `id` (PandaScore Team ID), `roster` (format JSONB stockant les joueurs et leurs positions), `cached_at`.

### Indexations Clés :
*   `idx_users_email` sur `users(email)` : Accélère les requêtes d'authentification (login).
*   `idx_matches_scheduled_at` sur `matches(scheduled_at)` : Indispensable pour accélérer le filtrage du calendrier par semaine lors de la navigation.

---

## 📝 4. Explication Pas-à-Pas des Snippets Backend

Voici les portions de code critiques du backend que tu pourrais avoir à expliquer :

### Snippet A : Le Lazy-Loading du Roster d'Équipe
*   **Fichier** : `controllers/matchesController.js`
*   **Principe** : L'API PandaScore limitant nos requêtes gratuites, nous ne téléchargeons pas les rosters de toutes les équipes sur la page d'accueil. Nous attendons que l'utilisateur clique sur un match pour étendre la carte. Le backend vérifie si le roster est déjà stocké en base de données. Si oui, il le renvoie (Cache Hit). Si non, il le télécharge depuis PandaScore, l'enregistre en base et le renvoie (Cache Miss).

```javascript
const getTeamDetails = async (req, res) => {
    const { id } = req.params;
    try {
        // 1. Vérification dans le cache local (PostgreSQL)
        const cached = await db.query('SELECT roster FROM teams_cache WHERE id = $1', [id]);
        if (cached.rows.length > 0) {
            return res.json(cached.rows[0].roster); // Cache Hit
        }

        // 2. Cache Miss : Appel à l'API PandaScore
        const response = await axios.get(`https://api.pandascore.co/teams/${id}`, {
            headers: { Authorization: `Bearer ${process.env.PANDASCORE_API_KEY}` }
        });

        const roster = response.data.players || [];

        // 3. Stockage du résultat dans la table cache pour les futurs appels
        await db.query(
            'INSERT INTO teams_cache (id, roster) VALUES ($1, $2) ON CONFLICT (id) DO UPDATE SET roster = $2',
            [id, JSON.stringify(roster)]
        );

        return res.json(roster);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};
```

---

### Snippet B : Interception des logs vers Winston & Grafana Loki
*   **Fichier** : `instrument.js`
*   **Principe** : Au lieu de modifier tous les fichiers du projet pour y ajouter notre logger, nous interceptons globalement les méthodes natives de la console de Node.js (`console.log`, `console.warn`, `console.error`) au démarrage du serveur pour rediriger de manière invisible tous les flux vers un logger Winston configuré avec un transport HTTP direct vers Grafana Loki.

```javascript
const logger = require('./utils/logger');

// Surcharge globale de console.log pour le rediriger vers Winston (Loki)
console.log = (...args) => logger.info(
    args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' ')
);

console.error = (...args) => logger.error(
    args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' ')
);
```

---

### Snippet C : Le Middleware de Protection de Route (JWT)
*   **Fichier** : `middleware/auth.js`
*   **Principe** : Ce middleware intercepte les requêtes vers les routes protégées (comme l'ajout de favoris). Il extrait le token JWT envoyé dans l'en-tête `Authorization: Bearer <token>`, le décode à l'aide de notre clé secrète, et injecte l'identifiant de l'utilisateur (`req.user`) dans la requête pour que le contrôleur puisse l'utiliser de manière sécurisée.

```javascript
const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Extraction du Token après "Bearer"

    if (!token) {
        return res.status(401).json({ error: 'Access Denied: No Token Provided' });
    }

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        req.user = verified; // Injection de l'objet utilisateur (id, email) décode dans req
        next(); // Passage au contrôleur suivant
    } catch (err) {
        return res.status(403).json({ error: 'Invalid Token' });
    }
};
```

---

## 🔄 5. Fonctionnement de la Pipeline CI/CD

Notre pipeline d'Intégration Continue (CI) configurée dans GitHub Actions automatise les tests pour chaque validation de code sur les branches `dev`, `staging`, et `main`.

### Processus de Validation du Backend (GitHub Actions) :
1.  **Démarrage d'un conteneur PostgreSQL** dans l'environnement d'exécution de GitHub Actions.
2.  **Installation des dépendances** (`npm ci`).
3.  **Initialisation de la base de données** en exécutant le script `scripts/initTestDb.js` (création des tables, index et migrations).
4.  **Lancement de la suite de tests automatisée** (`npm test` avec Jest et Supertest) :
    *   *Ce qui est testé* : L'inscription (POST `/api/auth/register`), la connexion (POST `/api/auth/login`), la double vérification, la réinitialisation de mots de passe, et l'ajout/suppression de favoris (GET et POST `/api/user/favorites`).
5.  **Validation du Docker Build** : Test de création de l'image de production Docker pour s'assurer qu'aucun fichier de configuration ou dépendance n'est manquant.

---

## 🛠️ 6. Incidents Récents Résolus (Valeur Ajoutée DevOps)
Savoir expliquer les bugs rencontrés en phase d'intégration montre ta maturité technique :
*   **Le Hoisting de `triggerAlert` (Frontend)** : En CI, le linter échouait car `triggerAlert` était défini en `const` fléchée en bas du fichier et appelée en haut. Nous avons converti la variable en déclaration standard `function triggerAlert() { ... }` car les déclarations de fonctions en JS sont entièrement hissées (hoisted) au début de l'exécution.
*   **La désynchronisation IEM Cologne (Counter Strike)** : PandaScore nomme ce tournoi `"Intel Extreme Masters"` (sans le mot clé "IEM"). Notre code d'origine ne scannait que 5 pages d'API. Nous avons étendu le scan à 30 pages de ligues pour capturer les anciens ID de tournois et normalisé les slugs (`cs-2`, `counter-strike`) vers `cs-go`.
*   **Le bug R6 du LocalStorage** : Après avoir simplifié les filtres R6 (passage de 13 filtres à 7 grandes catégories régionales), les anciens utilisateurs ne voyaient plus aucun match R6 car leur navigateur chargeait les anciens filtres obsolètes depuis leur cache LocalStorage. Nous avons ajouté une fonction de détection et de réinitialisation sécurisée dans `App.jsx`.
