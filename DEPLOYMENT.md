# 🚀 Pro Deployment Guide: NexQuiz
    
This guide outlines the **best free-tier stack** for deploying the NexQuiz platform in 2026.

## 🏗️ The Recommended Stack
| Component | Platform | Why? |
| :--- | :--- | :--- |
| **Frontend** | **Vercel** | Industry standard for Vite/React. Best performance and global CDN. |
| **Backend** | **Render** | Supports persistent connections (WebSockets) and is very stable. |
| **Database** | **Railway** (MySQL) | One-click MySQL setup with a generous trial/free-tier and high reliability. |

---

## 1. 📂 Step 1: Database (Railway)
1.  Go to [Railway.app](https://railway.app) and create a New Project.
2.  Choose **Add MySQL**.
3.  Click on the MySQL service → **Variables** tab.
4.  Copy the `MYSQL_URL` or individual components (`MYSQLHOST`, `MYSQLUSER`, `MYSQLPASSWORD`, etc.).
5.  **Initialize Tables**: Connect to the DB using a tool like HeidiSQL or DBeaver and run the code from `server/schema.sql`.

## 2. 🔌 Step 2: Backend (Render)
1.  Sign in to [Render.com](https://render.com).
2.  **New** → **Web Service**.
3.  Connect your GitHub Repo.
4.  **Root Directory**: Set to `server`.
5.  **Build Command**: `npm install`
6.  **Start Command**: `npm start` (I have added this to your `package.json`).
7.  **Environment Variables**:
    *   `DB_HOST`: *From Railway*
    *   `DB_USER`: *From Railway*
    *   `DB_PASSWORD`: *From Railway*
    *   `DB_NAME`: `railway` (or whatever Railway named your DB)
    *   `JWT_SECRET`: *A long random string*
    *   `CLIENT_URL`: `https://your-app.vercel.app` (You will get this next)
    *   `NODE_ENV`: `production`

## 3. 🌐 Step 3: Frontend (Vercel)
1.  Go to [Vercel.com](https://vercel.com) and import your repo.
2.  **CRITICAL**: You DO NOT need to set the Root Directory to `client` anymore because I added a root-level `vercel.json` and `package.json` to handle it automatically.
3.  **Environment Variables**:
    *   `VITE_API_URL`: `https://your-backend.onrender.com/api`
4.  Click **Deploy**.

---

## 🛠️ Deployment Troubleshooting
*   **404 on refresh?** Fixed via `vercel.json`.
*   **CORS Error?** Ensure `CLIENT_URL` in Render matches your Vercel URL exactly (no trailing slash).
*   **Socket.io Disconnects?** Render's free tier spins down after 15 mins of inactivity. In production, consider Render's $7/mo plan for "No spin down" behavior.

## ✅ Verification
1.  Visit your Vercel URL.
2.  Open Network tab (F12) → ensure requests go to Render.
3.  Check Real-time features (Join a quiz and see if the proctor dashboard updates).
