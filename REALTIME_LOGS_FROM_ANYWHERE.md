# 📡 Real-Time Log Access — From Anywhere
## ORA Jewellery Production VPS (api.orashop.in)

**VPS IP:** `76.13.247.61`  
**SSH User:** `deploy`  
**SSH Alias:** `ora-vps`  
**App:** PM2 cluster → `/var/log/pm2/`  
**Nginx logs:** `/var/log/nginx/`

---

## 🔑 Prerequisites (One-Time Setup)

Before you can read logs from anywhere, your SSH key must be on the VPS.

```bash
# On your LOCAL machine — check if your key exists
ls ~/.ssh/id_rsa.pub || ls ~/.ssh/id_ed25519.pub

# If not, generate one
ssh-keygen -t ed25519 -C "your@email.com"

# Copy key to VPS
ssh-copy-id deploy@76.13.247.61

# Test the alias works
ssh ora-vps "echo OK"
```

If the `ora-vps` alias is not set up on the new machine:
```bash
# Add to ~/.ssh/config
cat >> ~/.ssh/config <<'EOF'

Host ora-vps
    HostName 76.13.247.61
    User deploy
    IdentityFile ~/.ssh/id_ed25519
    ServerAliveInterval 60
    ServerAliveCountMax 3
EOF
```

---

## Method 1 — SSH from Any Machine (Fastest)

### From any Linux/Mac laptop or desktop

```bash
# ─── Live streaming (all logs, real-time) ───
ssh ora-vps "pm2 logs"

# ─── Errors only (live) ───
ssh ora-vps "pm2 logs --err"

# ─── Output only (live, no errors) ───
ssh ora-vps "pm2 logs --out"

# ─── Last N lines then stop (no streaming) ───
ssh ora-vps "pm2 logs --lines 100 --nostream"
ssh ora-vps "pm2 logs --err --lines 50 --nostream"

# ─── Raw file tail (most direct) ───
ssh ora-vps "tail -f /var/log/pm2/ora-backend-combined.log"
ssh ora-vps "tail -f /var/log/pm2/ora-backend-error.log"
ssh ora-vps "tail -100 /var/log/pm2/ora-backend-out.log"

# ─── Nginx access logs (every HTTP request) ───
ssh ora-vps "sudo tail -f /var/log/nginx/access.log"

# ─── Nginx error logs ───
ssh ora-vps "sudo tail -f /var/log/nginx/error.log"
```

### From Windows (PowerShell / Windows Terminal)

Install [PuTTY](https://www.putty.org/) or use the built-in OpenSSH:

```powershell
# Same commands work in PowerShell
ssh deploy@76.13.247.61 "pm2 logs --err"
ssh deploy@76.13.247.61 "tail -f /var/log/pm2/ora-backend-combined.log"
```

---

## Method 2 — From Your Phone (iOS / Android)

### iOS — Use **Termius** (Free)
1. Download [Termius](https://termius.com/) from App Store
2. Add Host:
   - **Host:** `76.13.247.61`
   - **Username:** `deploy`
   - **Auth:** Import your private key (`id_ed25519`)
3. Connect → type:
```bash
pm2 logs
# or
tail -f /var/log/pm2/ora-backend-combined.log
```

### Android — Use **JuiceSSH** (Free)
1. Download [JuiceSSH](https://juicessh.com/) from Play Store
2. Add identity with your private key
3. Add connection: `deploy@76.13.247.61`
4. Connect → same commands as above

### Export Private Key for Mobile

```bash
# On your laptop — copy your key to share with phone
cat ~/.ssh/id_ed25519
# Copy the entire output (including BEGIN/END lines) and paste into the app
```

---

## Method 3 — PM2 Plus Web Dashboard (No SSH Needed)

PM2 Plus gives you a **web browser dashboard** at [app.pm2.io](https://app.pm2.io) with real-time logs, CPU, memory.

### Setup on VPS (one-time)

```bash
# On VPS — create a free account at https://app.pm2.io
# Then link your server:
ssh ora-vps "pm2 link <secret_key> <public_key>"

# Example (replace with your keys from pm2.io):
ssh ora-vps "pm2 link abc123def456 xyz789ghi012"
```

### How to Get Your Keys

1. Go to [app.pm2.io](https://app.pm2.io) → Create free account
2. Click **"Connect a server"**
3. Copy the `pm2 link <secret> <public>` command
4. Run it on the VPS via SSH

### Access

- Open [app.pm2.io](https://app.pm2.io) from **any browser, any device**
- See live logs, restart counts, memory, CPU
- No SSH needed after setup

---

## Method 4 — Log Forwarding to BetterStack (Recommended for Production)

[BetterStack Logtail](https://betterstack.com/logtail) — Free tier available. Sends logs to a cloud dashboard accessible from any browser.

### Setup on VPS

```bash
# Install Vector (log forwarder)
ssh ora-vps "
curl -1sLf 'https://repositories.timber.io/core/stable/debian/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/timber.gpg
echo 'deb [signed-by=/usr/share/keyrings/timber.gpg] https://repositories.timber.io/core/stable/debian/ *' | sudo tee /etc/apt/sources.list.d/timber.list
sudo apt update && sudo apt install -y vector
"
```

Create the config (replace `YOUR_BETTERSTACK_TOKEN` with token from BetterStack dashboard):

```bash
ssh ora-vps "sudo tee /etc/vector/vector.toml > /dev/null <<'EOF'
[sources.pm2_logs]
  type = \"file\"
  include = [\"/var/log/pm2/*.log\"]
  read_from = \"end\"

[sources.nginx_logs]
  type = \"file\"
  include = [\"/var/log/nginx/access.log\", \"/var/log/nginx/error.log\"]
  read_from = \"end\"

[sinks.logtail]
  type = \"http\"
  inputs = [\"pm2_logs\", \"nginx_logs\"]
  uri = \"https://in.logs.betterstack.com\"
  encoding.codec = \"json\"
  auth.strategy = \"bearer\"
  auth.token = \"YOUR_BETTERSTACK_TOKEN\"
EOF
sudo systemctl enable vector
sudo systemctl start vector
"
```

### Access

- Open [logs.betterstack.com](https://logs.betterstack.com) from **any device, any browser**
- Search, filter, and tail logs in real time
- Set up alerts (e.g., email/Slack on error)

---

## Method 5 — Telegram Bot Alerts for Critical Errors

Get **instant Telegram messages** on your phone when errors happen.

### Create Telegram Bot (One-Time)

1. Open Telegram → search for `@BotFather`
2. Send `/newbot` → name it `ORA Production Alerts`
3. Copy the **API token** (format: `123456789:AABBccDDeeFF...`)
4. Get your **Chat ID**: message `@userinfobot` on Telegram

### Install Alert Script on VPS

```bash
ssh ora-vps "cat > ~/log-alert.sh << 'SCRIPT'
#!/bin/bash
TOKEN=\"YOUR_BOT_TOKEN\"
CHAT_ID=\"YOUR_CHAT_ID\"

tail -f /var/log/pm2/ora-backend-error.log | while read LINE; do
  if echo \"\$LINE\" | grep -qiE \"error|crash|ECONNREFUSED|out of memory|killed\"; then
    MSG=\"🚨 ORA API Error%0A\$(date '+%H:%M:%S')%0A\${LINE:0:300}\"
    curl -s \"https://api.telegram.org/bot\${TOKEN}/sendMessage\" \
      -d chat_id=\"\$CHAT_ID\" \
      -d text=\"\$MSG\" > /dev/null
  fi
done
SCRIPT
chmod +x ~/log-alert.sh"
```

### Run as a Background Service

```bash
ssh ora-vps "cat > /etc/systemd/system/ora-log-alert.service <<'EOF'
[Unit]
Description=ORA Log Alert — Telegram Notifications
After=network.target

[Service]
ExecStart=/home/deploy/log-alert.sh
Restart=always
User=deploy

[Install]
WantedBy=multi-user.target
EOF
sudo systemctl daemon-reload
sudo systemctl enable ora-log-alert
sudo systemctl start ora-log-alert"
```

Now **every crash/error** sends a Telegram message to your phone instantly.

---

## Method 6 — Web-Based SSH (No App Install Needed)

### Option A: Vercel/Netlify Shell Proxy (Advanced)

Not recommended for production security. Use Termius or JuiceSSH instead (see Method 2).

### Option B: Cloudflare Tunnel (Access VPS Terminal via Browser)

```bash
# Install cloudflared on VPS
ssh ora-vps "
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 \
  -o /usr/local/bin/cloudflared
chmod +x /usr/local/bin/cloudflared
"

# Login (follow browser prompt)
ssh ora-vps "cloudflared tunnel login"

# Create tunnel
ssh ora-vps "cloudflared tunnel create ora-logs"

# Configure SSH access through Cloudflare
ssh ora-vps "cloudflared tunnel route ssh ora-logs deploy@76.13.247.61"
```

After setup, you can SSH via Cloudflare from **any browser** at no cost on the free tier.

---

## Method 7 — Download Logs to Local Machine

For detailed offline analysis or sharing with someone else:

```bash
# Download last 5000 lines of combined log
ssh ora-vps "tail -5000 /var/log/pm2/ora-backend-combined.log" > /tmp/ora-logs.txt

# Download error log only
ssh ora-vps "cat /var/log/pm2/ora-backend-error.log" > /tmp/ora-errors.txt

# Download and view immediately
ssh ora-vps "tail -200 /var/log/pm2/ora-backend-combined.log" | less

# Download as compressed archive
ssh ora-vps "tar -czf /tmp/ora-logs-$(date +%Y%m%d).tar.gz /var/log/pm2/" && \
scp ora-vps:/tmp/ora-logs-$(date +%Y%m%d).tar.gz ~/Downloads/

# Copy to a specific date
scp ora-vps:/var/log/pm2/ora-backend-combined.log ~/Downloads/ora-combined-$(date +%Y%m%d).log
```

---

## Method 8 — Quick Health Check from Anywhere (No SSH)

These work from **any browser or terminal, no SSH key needed**:

```bash
# Basic health check
curl https://api.orashop.in/api/health

# Expected response:
# {"status":"ok","timestamp":"2026-03-02T...","uptime":12345}

# Response time check
curl -w "\nTotal: %{time_total}s\n" -o /dev/null -s https://api.orashop.in/api/health

# Test specific endpoints
curl -s https://api.orashop.in/api/products | head -c 200
```

---

## 🧰 Quick Reference Cheat Sheet

| What to see | Command |
|---|---|
| **Live all logs** | `ssh ora-vps "pm2 logs"` |
| **Live errors only** | `ssh ora-vps "pm2 logs --err"` |
| **Last 100 lines** | `ssh ora-vps "pm2 logs --lines 100 --nostream"` |
| **Follow log file** | `ssh ora-vps "tail -f /var/log/pm2/ora-backend-combined.log"` |
| **Nginx access log** | `ssh ora-vps "sudo tail -f /var/log/nginx/access.log"` |
| **Nginx error log** | `ssh ora-vps "sudo tail -f /var/log/nginx/error.log"` |
| **PM2 process status** | `ssh ora-vps "pm2 status"` |
| **CPU + Memory live** | `ssh ora-vps "pm2 monit"` |
| **Search for errors** | `ssh ora-vps "grep -i error /var/log/pm2/ora-backend-combined.log \| tail -20"` |
| **Grep specific time** | `ssh ora-vps "grep '2026-03-02 14:' /var/log/pm2/ora-backend-combined.log"` |
| **Health check URL** | `curl https://api.orashop.in/api/health` |

---

## 🚨 Log File Locations on VPS

| Log | Path |
|---|---|
| PM2 combined | `/var/log/pm2/ora-backend-combined.log` |
| PM2 stdout | `/var/log/pm2/ora-backend-out.log` |
| PM2 stderr | `/var/log/pm2/ora-backend-error.log` |
| Nginx access | `/var/log/nginx/access.log` |
| Nginx error | `/var/log/nginx/error.log` |
| System journal | `journalctl -u nginx` / `journalctl -u pm2-deploy` |

---

## 🔒 Security Notes

- **Never share your private key** (`~/.ssh/id_ed25519`) — only share the public key (`.pub`)
- For phone SSH apps, use a **separate key pair** dedicated to mobile access:
  ```bash
  ssh-keygen -t ed25519 -C "mobile-access" -f ~/.ssh/id_ed25519_mobile
  ssh-copy-id -i ~/.ssh/id_ed25519_mobile.pub deploy@76.13.247.61
  ```
- Revoke mobile access any time by removing it from `/home/deploy/.ssh/authorized_keys` on the VPS

---

## ✅ Recommended Setup (Do Once)

| Priority | Method | Effort |
|---|---|---|
| 🟥 Do immediately | SSH key on all your machines | 5 min |
| 🟥 Do immediately | Termius/JuiceSSH on phone | 5 min |
| 🟧 This week | BetterStack Logtail (cloud logs) | 20 min |
| 🟧 This week | Telegram error alerts | 15 min |
| 🟩 Optional | PM2 Plus web dashboard | 10 min |
| 🟩 Optional | Cloudflare Tunnel (browser SSH) | 30 min |
