# ⚙️ Environments Setup Guide (Dev/Staging, Prod)

This document describes how to configure the isolated environments for **eSportCal** using **2 Supabase databases** (due to free tier limitations), **Vercel** (Frontend), and **Railway** (Backend).

---

## 💾 1. Database Configuration (Supabase)

Due to the Supabase limit of **2 free projects per user/org**, we will utilize a 2-database model:

1.  **Development & Staging DB**: `esportcal-dev-staging`
    *   Shared for development tests, automatic dev deployments, and staging validation before release.
    *   *Alternative*: For local development, you can also run a local PostgreSQL instance (`localhost:5432`) to keep your online staging database completely clean.
2.  **Production DB**: `esportcal-prod`
    *   The live database connected strictly to `esportcal.com` (main branch).

---

## ⚙️ 2. Backend Configuration (Railway)

On Railway, you should create three separate services within your project, mapped to their respective Git branches:

### A. Development Service (`esportcal-backend-dev`)
*   **Git Branch**: `dev` (Automatic deployment on push)
*   **Variables**:
    ```env
    PORT=5001
    NODE_ENV=development
    DB_HOST=your_dev_staging_supabase_host
    DB_USER=postgres
    DB_PASSWORD=your_dev_staging_supabase_password
    DB_NAME=postgres
    DB_PORT=5432
    JWT_SECRET=dev_jwt_secret_phrase
    PANDASCORE_API_KEY=your_pandascore_api_key
    EMAIL_USER=sandbox_or_test_email
    EMAIL_PASS=sandbox_or_test_email_password
    ```

### B. Staging Service (`esportcal-backend-staging`)
*   **Git Branch**: `staging` (Automatic deployment on push/PR merge)
*   **Variables**:
    ```env
    PORT=5001
    NODE_ENV=staging
    DB_HOST=your_dev_staging_supabase_host
    DB_USER=postgres
    DB_PASSWORD=your_dev_staging_supabase_password
    DB_NAME=postgres
    DB_PORT=5432
    JWT_SECRET=staging_jwt_secret_phrase
    PANDASCORE_API_KEY=your_pandascore_api_key
    EMAIL_USER=staging_or_sandbox_email
    EMAIL_PASS=staging_or_sandbox_email_password
    ```

### C. Production Service (`esportcal-backend-prod`)
*   **Git Branch**: `main` (Automatic deployment on push/PR merge to main)
*   **Variables**:
    ```env
    PORT=5001
    NODE_ENV=production
    DB_HOST=your_prod_supabase_host
    DB_USER=postgres
    DB_PASSWORD=your_prod_supabase_password
    DB_NAME=postgres
    DB_PORT=5432
    JWT_SECRET=prod_high_security_jwt_secret_phrase
    PANDASCORE_API_KEY=your_pandascore_api_key
    EMAIL_USER=esportcalndr@gmail.com
    EMAIL_PASS=glzf szqf rlfv zglu
    ```

---

## 🖥️ 3. Frontend Configuration (Vercel)

Configure `VITE_API_URL` dynamically in Vercel:

1.  **Development Environment** (linked to `dev` branch):
    *   **Value**: URL of `esportcal-backend-dev`
2.  **Preview (Staging) Environment** (linked to `staging` branch):
    *   **Value**: URL of `esportcal-backend-staging`
3.  **Production Environment** (linked to `main` branch):
    *   **Value**: URL of `esportcal-backend-prod`
