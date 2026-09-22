# SAHAY Platform — Online Deployment & Database Security Guide

This guide explains how to deploy the **SAHAY** system online, ensure that the **SQLite database remains persistent and secure**, and grant access **exclusively to the developer**.

---

## Architecture & Security Model

```
┌────────────────────────────────────────────────────────────────────────┐
│                          INTERNET (HTTPS)                              │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        SAHAY SSR Server (Node 24)                      │
│                                                                        │
│  [Public]                              [Staff only: session cookie]    │
│   • Guest check-in (POST /api/checkins)  • GET  /api/alerts            │
│   • Optional alias account               • GET/POST /api/logs          │
│   • AI triage (POST /api/chat)                                         │
│         │                                                              │
│         ▼  best-effort redaction of phone numbers & emails             │
│  [Gemini API]  receives message, feeling, screening answers only       │
│                (never name, age, district, contact or location)        │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Direct file I/O
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                 DATABASE: $DATA_DIR/sahay.db (SQLite, WAL)             │
│                                                                        │
│  • Messages, names, contacts, locations: AES-256-GCM (DATA_ENCRYPTION_KEY) │
│  • Passwords: salted PBKDF2-SHA512 (100,000 iterations)                │
│  • Sessions: only SHA-256 of the cookie token is stored                │
│  • Retention: check-ins/alerts 180 days, audit log 365 days            │
│  • Developer access: server shell only (`npm run db:admin`)            │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 1. Instant Online Demo in 30 Seconds (Free, No Deployment Needed)

If you want to share a live HTTPS link with evaluators or teammates right now from your local computer:

### Using Cloudflare Tunnel (Recommended — Fast & Free):
1. Install Cloudflare CLI:
   - Windows (PowerShell as Admin): `winget install --id Cloudflare.cloudflared`
   - Or download executable from [Cloudflare](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/)
2. Make sure SAHAY is running locally on port 4321 (`npm.cmd run dev` or `npm.cmd start`).
3. Run:
   ```bash
   cloudflared tunnel --url http://localhost:4321
   ```
4. Cloudflare will print a secure public HTTPS URL (e.g. `https://random-words.trycloudflare.com`). Anyone with this link can test the site live!

### Or Using Ngrok:
```bash
npx ngrok http 4321
```

---

## 2. Free Cloud Hosting with Persistent SQLite Storage

Because SAHAY uses SQLite (`./data/sahay.db`), you should host it on a provider that supports **Persistent Disks / Volumes** so data is never lost when the server restarts.

### Option A: Railway.app (Easiest & Most Reliable)

> Railway does **not** accept a `VOLUME` instruction in the Dockerfile (build fails with
> "docker VOLUME ... is not supported, use Railway Volumes"). The Dockerfile no longer
> declares one; persistence comes from a Railway Volume instead.

1. Push this project to your GitHub repository.
2. Go to [Railway.app](https://railway.app/) and sign in with GitHub.
3. Click **New Project** → **Deploy from GitHub repo** → select this repository.
4. Attach a **Volume** so `sahay.db` survives redeploys:
   - Right-click the service (or open the Command Palette) → **Attach Volume**.
   - **Mount path**: `/app/data`
   - Railway also exposes `RAILWAY_VOLUME_MOUNT_PATH`, which the app reads automatically.
5. Set environment variables (service → **Variables**):
   - `DATA_ENCRYPTION_KEY`: **required**. Generate once with
     `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` and never change it.
   - `SEED_PASSWORD_RIYA`, `SEED_PASSWORD_DIVYA`, `SEED_PASSWORD_AYUSH`, `SEED_PASSWORD_PRASHANT`,
     `SEED_PASSWORD_DISTRICT_OFFICER`, `SEED_PASSWORD_STATE_OFFICER`, `SEED_PASSWORD_NATIONAL_OFFICER`:
     staff passwords. If you skip them, random ones are printed once in the deploy logs.
   - `GEMINI_API_KEY`: your Google Gemini key (use a paid tier for real users).
   - `RAILWAY_RUN_UID`: `0` — only if the logs show a permission error writing to `/app/data`
     (Railway volumes are mounted as root; the image runs as the `node` user).
   - Do **not** set `PORT`; Railway injects it.
6. Railway builds the Dockerfile and serves the app on a `*.up.railway.app` HTTPS domain.

### Option B: Render.com
1. Go to [Render.com](https://render.com/) and click **New +** → **Web Service**.
2. Connect your GitHub repository.
3. Select **Environment**: **Docker**.
4. In **Disks**, click **Add Disk**:
   - **Name**: `sahay_data`
   - **Mount Path**: `/app/data`
   - **Size**: 1 GB
5. In **Environment Variables**:
   - `GEMINI_API_KEY`: *(Your key)*
   - `DATA_ENCRYPTION_KEY`: *(64-hex-character key, see Railway step 5)*
   - `SEED_PASSWORD_<USERNAME>` for each staff account
6. Click **Create Web Service**.

### Option C: Fly.io
1. Install Fly CLI: `winget install --id Fly.flyctl` (Windows) or `curl -L https://fly.io/install.sh | sh` (Linux/Mac).
2. Run in project directory:
   ```bash
   fly launch
   ```
3. Create the persistent volume:
   ```bash
   fly volumes create sahay_data --size 1
   ```
4. In `fly.toml`, add:
   ```toml
   [mounts]
     source = "sahay_data"
     destination = "/app/data"
   ```
5. Deploy:
   ```bash
   fly deploy
   ```

---

## 3. Dedicated VPS Deployment (DigitalOcean, AWS EC2, Hetzner, Linode)

For maximum data sovereignty and governmental compliance:

### Step 1: Copy Code to Server
```bash
git clone <your-repo-url> /opt/sahay
cd /opt/sahay
```

### Step 2: Configure Environment
Create a `.env` file:
```bash
GEMINI_API_KEY=your_gemini_api_key_here
DATA_ENCRYPTION_KEY=<64 hex characters>
SEED_PASSWORD_RIYA=<strong password>
# ...one SEED_PASSWORD_<USERNAME> per staff account (see .env.example)
PORT=4321
HOST=0.0.0.0
```

### Step 3: Run with Docker Compose
```bash
docker compose up -d --build
```
This automatically maps `./data:/app/data`, persisting `sahay.db` directly on the server's filesystem.

### Step 4: Add Automated HTTPS with Caddy
Install Caddy (`sudo apt install caddy`), then edit `/etc/caddy/Caddyfile`:
```caddy
yourdomain.gov.in {
    reverse_proxy localhost:4321
}
```
Reload Caddy: `sudo systemctl reload caddy`. Caddy will automatically generate and renew SSL certificates from Let's Encrypt.

---

## 4. How the Developer Inspects the Database

The database file is not served over HTTP. Staff see only what the authenticated APIs return; the full database is available only from a server shell.

> `db:admin` prints the raw table contents. Sensitive columns appear as `enc:v1:...` ciphertext because they are encrypted at rest.

Run the built-in Admin CLI utility:

```bash
# View summary of all tables, counsellors, alerts, and check-ins:
npm run db:admin

# View specific sections:
node ./scripts/admin-db.mjs counsellors
node ./scripts/admin-db.mjs alerts
node ./scripts/admin-db.mjs checkins
node ./scripts/admin-db.mjs logs
```

### Database Backup & Restore:
To back up the database, simply copy `./data/sahay.db`:
```bash
# Backup
cp ./data/sahay.db ./data/backup-$(date +%F).db

# Download backup to your local computer (from VPS):
scp user@your-server-ip:/opt/sahay/data/sahay.db ./local-backup.db
```

---

## 5. Built-in Accounts

| Role | Username | Password source |
| :--- | :--- | :--- |
| Counsellor | `riya`, `divya`, `ayush`, `prashant` | `SEED_PASSWORD_<USERNAME>` |
| District / State / National authority | `district_officer`, `state_officer`, `national_officer` | `SEED_PASSWORD_<USERNAME>` |
| Victim (guest) | none | none |
| Victim (registered) | chosen alias | chosen by the user (min. 8 characters) |

- **Production:** if a `SEED_PASSWORD_*` variable is missing, a random password is generated and printed once in the server log. Set or change the variable and restart to rotate a password (existing sessions for that account are signed out).
- **Local development only** (`npm run dev`): unset variables fall back to the demo passwords defined in `src/lib/db.ts`. Never deploy with `NODE_ENV` other than production.
- The old shared `counsellor / SAHAY@2026` account has been removed and is deleted from existing databases on startup.
