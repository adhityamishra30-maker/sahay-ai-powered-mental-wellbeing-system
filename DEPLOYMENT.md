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
│  [Public Web Endpoints]               [Sanitization Gateway]           │
│   • 1-Click Anonymous Guest             • Strips PII (Names, Phones)   │
│   • Optional Registered Victim Login    • Enforces Academic Citations  │
│   • Mandatory Staff & Authority Login        │                         │
│                                              ▼                         │
│                                    [Gemini AI Triage API]              │
│                                    (Receives ONLY sanitized distress   │
│                                     sentiment & trauma indicators)     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Direct File I/O (NOT over HTTP)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                SECURE LOCAL DATABASE: ./data/sahay.db                  │
│                                                                        │
│  • Storage: Native Node 24 SQLite (WAL mode, fast & ACID compliant)    │
│  • Passwords: Salted SHA-512 PBKDF2 (100,000 iterations)               │
│  • Accessibility: STRICTLY RESTRICTED to local server filesystem.      │
│    Zero public URLs or external ports expose this database file.       │
│  • Developer Access: Exclusively via SSH / CLI: `npm run db:admin`    │
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
1. Push this project to your GitHub repository.
2. Go to [Railway.app](https://railway.app/) and sign in with GitHub.
3. Click **New Project** → **Deploy from GitHub repo** → select this repository.
4. Add a **Persistent Volume**:
   - In your Railway service settings, click **Volumes** → **Add Volume**.
   - Set **Mount Path** to: `/app/data`
5. Set Environment Variables (in the **Variables** tab):
   - `PORT`: `4321`
   - `HOST`: `0.0.0.0`
   - `GEMINI_API_KEY`: *(Your Google Gemini API Key)*
6. Railway will automatically build the Dockerfile and launch your app with a free `*.up.railway.app` HTTPS domain.

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

Because the database is **NOT accessible via any web URL or client query**, only you (the developer with server/terminal access) can inspect and manage it.

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

## 5. Summary of Built-in Credentials

| Role | Username | Password | Specialization / Scope |
| :--- | :--- | :--- | :--- |
| **Counsellor 1** | `riya` | `Riya@2026` | Senior Trauma Specialist (Crisis & high-risk triage) |
| **Counsellor 2** | `divya` | `Divya@2026` | Clinical Well-being Counsellor (Emotional recovery) |
| **Counsellor 3** | `ayush` | `Ayush@2026` | Case Manager (Rehabilitation & institutional follow-up) |
| **Counsellor 4** | `prashant` | `Prashant@2026` | District Response Counsellor (Field & immediate safety) |
| **District Authority** | `district_officer` | `District@2026` | South Delhi District Authority |
| **State Authority** | `state_officer` | `State@2026` | Delhi State Tier Authority |
| **National Authority** | `national_officer` | `National@2026` | National MoSJE Delhi Headquarters |
| **Victim Access (Guest)** | *None* | *None* | 1-Click Instant Anonymous Session |
| **Victim Access (Registered)**| User-defined | User-defined | Created via Sign-up form |
