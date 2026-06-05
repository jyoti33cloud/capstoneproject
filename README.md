# Asha (आशा) — Autism Support Nepal

A bilingual (English / नेपाली) PERN-stack web app supporting parents of autistic children in Nepal.

## What's inside

- **Backend** — Node.js + Express + PostgreSQL + JWT auth + Google OAuth (`/server`)
- **Frontend** — React + Vite + Tailwind CSS + React Router + Google Sign-In (`/client`)
- **Features** — Auth (password & Google OAuth), Learning Centre, Community forum (posts, likes, replies), Find Help (specialists/centers), Appointment booking, Daily Routine tracker, AAC Communication Board with text-to-speech

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL 13+ running locally (or any reachable Postgres)
- Google OAuth credentials (for authentication)

## 0. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable the Google+ API
4. Create OAuth 2.0 credentials (Web application type)
   - Authorized JavaScript origins: `http://localhost:5173` (and production URL)
   - Authorized redirect URIs: `http://localhost:5173` (and production URL)
5. Copy the **Client ID** and **Client Secret**

## 1. Backend setup

```bash
cd server
npm install
cp .env.example .env
```

Edit `.env` with your actual values:

```
PORT=3001
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/asha
JWT_SECRET=any_long_random_string
CLIENT_ORIGIN=http://localhost:5173
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

Create the database in psql / pgAdmin:

```sql
CREATE DATABASE asha;
```

Initialize the database:

```bash
npm run db:init
```

You'll see: `✔ Database ready.`

Start the API:

```bash
npm run dev      # with nodemon
# or
npm start        # plain node
```

API will run on **http://localhost:3001**. Test it: `http://localhost:3001/api/health`

## 2. Frontend setup

In a new terminal:

```bash
cd client
npm install
cp .env.example .env
```

Edit `.env`:

```
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

Start dev server:

```bash
npm run dev
```

Open **http://localhost:5173**

## Authentication

Users can sign in via:
- **Google Sign-In** — recommended, uses Google OAuth
- **Email + Password** — traditional registration and login

## Notes

- **Language toggle**: top-right pill on every page (`EN | नेपाली`) — toggles all UI strings instantly. Children's labels (Eat / खानु) always show both languages.
- **AAC Tool**: tapping a card triggers the browser's speech synthesis in the currently selected language (works offline).
- **Routine tracker**: completion state is per-user, per-day, persisted to PostgreSQL.
- **Mobile-first**: layouts max out at `max-w-2xl` so they look great on phones, tablets, and desktops.

## Production build

```bash
cd client
npm run build         # → client/dist
```
