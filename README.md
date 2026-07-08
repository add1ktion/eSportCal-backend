# 🚀 eSportCal — Backend API

[![CI - Backend Validation](https://github.com/add1ktion/eSportCal-backend/actions/workflows/ci.yml/badge.svg)](https://github.com/add1ktion/eSportCal-backend/actions/workflows/ci.yml)
[![Docker Build](https://img.shields.io/badge/docker-built-blue.svg)](https://www.docker.com/)
[![Express](https://img.shields.io/badge/express-4.18-lightgrey.svg)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/postgresql-15-blue.svg)](https://www.postgresql.org/)

Ce dépôt contient l'API REST d'**eSportCal**, le calendrier centralisé des compétitions e-sportives.

---

## 🏛️ Architecture DevOps & Infrastructure

L'infrastructure d'eSportCal a été conçue pour suivre les standards professionnels de l'industrie (GitOps et Observabilité) :

### 1. Stratégie Multi-Environnements (Railway & Vercel)
Nous gérons trois environnements isolés configurés via des branches Git dédiées :
*   **Development (`dev`)** : Déploiement automatique de test local et sandbox.
*   **Staging (`staging`)** : Validation de pré-production avec base de données partagée.
*   **Production (`main`)** : Environnement de production hautement sécurisé connecté au domaine `esportcal.com`.

### 2. Base de Données (Supabase)
Pour pallier la limite de 2 projets gratuits de Supabase, nous utilisons une architecture intelligente :
*   **Base Dev/Staging** : Un unique projet PostgreSQL partagé pour le développement et la validation intermédiaire.
*   **Base Prod** : Un projet PostgreSQL isolé géographiquement et protégé pour assurer la sécurité et l'isolation des données des utilisateurs réels.
*   *Support Pooler* : Connexion gérée par pooler de transactions PG (port `6543`) avec fallback sur variables d'environnement unitaires.

### 3. Pipeline d'Intégration Continue (GitHub Actions)
À chaque commit ou Pull Request vers `dev`, `staging`, ou `main`, notre pipeline valide automatiquement l'intégrité du code :
*   **Sécurité (DevSecOps)** : Exécution automatique de `npm audit` pour bloquer les dépendances contenant des failles de sécurité.
*   **Base de données éphémère** : Lancement d'un conteneur Docker PostgreSQL 15, application dynamique des migrations et du schéma SQL.
*   **Tests d'intégration** : Exécution automatique de la suite de tests Jest (27 tests couvrant l'auth, la validation d'email, les favoris).
*   **Validation Docker** : Build de l'image de conteneur de production pour s'assurer de sa portabilité.

### 4. Observabilité & Télémétrie (Grafana Cloud & Sentry)
*   **Logs Centralisés** : Redirection globale de tous les `console.log` de l'application Node.js vers un logger Winston, diffusés en continu vers **Grafana Loki** au format JSON structuré.
*   **Métriques de Performance** : Un endpoint sécurisé `/metrics` expose les métriques système (utilisation CPU, RAM, lag de l'event loop) à un scraper **Prometheus**.
*   **Gestion des Erreurs** : Sentry setup et capture automatique des exceptions fatales.

---

## 🛠️ Installation & Démarrage Local

### Prérequis
*   Node.js v20+
*   PostgreSQL local ou distant

### Lancement
1. Installer les dépendances :
   ```bash
   npm install
   ```
2. Configurer le fichier `.env` (se référer à `docs/ENV_SETUP.md`).
3. Initialiser la base de données de test locale :
   ```bash
   node scripts/initTestDb.js
   ```
4. Lancer le serveur :
   ```bash
   npm start
   ```
