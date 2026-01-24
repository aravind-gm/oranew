# VPS Deployment Guide - ORA Jewellery with GoDaddy Domain

**Objective:** Deploy ORA Jewellery (frontend + backend) on a VPS using Docker, with your GoDaddy domain pointing to the VPS.

---

## 📋 Prerequisites

- ✅ GoDaddy domain purchased (e.g., `orashop.in`)
- ✅ GoDaddy account access
- ✅ VPS rented (GoDaddy/DigitalOcean/Linode)
- ✅ Git repository with your code
- ✅ SSH access to VPS

---

## 🏗️ Architecture Overview

```
GoDaddy Domain (orashop.in)
       ↓
   VPS Server (IP: xxx.xxx.xxx.xxx)
       ↓
   Nginx (Reverse Proxy)
       ├─→ :3000 (Frontend - Next.js)
       └─→ :5000 (Backend - Express API)
       ↓
   Docker Compose
       ├─ PostgreSQL (port 5432)
       ├─ Backend Container (port 5000)
       └─ Frontend Container (port 3000)
```

---

## 1️⃣ VPS Setup (Initial One-Time)

### Choose Your VPS Provider

**Option A: GoDaddy VPS**
- Login to GoDaddy → Products → Hosting → VPS
- Select plan (minimum: 2GB RAM, 50GB SSD)
- OS: Ubuntu 22.04 LTS (recommended)
- Note your VPS IP address

**Option B: DigitalOcean** (Easier, $5-6/month)
- Create account at digitalocean.com
- Create Droplet → Ubuntu 22.04 LTS → $5/month plan
- Note the IP address

### Connect to VPS via SSH

```bash
# On your local machine
ssh root@YOUR_VPS_IP
# Or with password: ssh -p 22 root@YOUR_VPS_IP
```

After first login, set a strong root password:
```bash
passwd
```

---

## 2️⃣ Install Docker & Docker Compose

### Update System
```bash
apt update && apt upgrade -y
```

### Install Docker
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
```

### Install Docker Compose
```bash
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
docker-compose --version
```

### Verify Installation
```bash
docker --version
docker-compose --version
```

---

## 3️⃣ Clone Your Repository

```bash
cd /opt
git clone https://github.com/YOUR_USERNAME/orashop.git
cd orashop
```

Or if using HTTPS with token:
```bash
git clone https://YOUR_TOKEN@github.com/YOUR_USERNAME/orashop.git
cd orashop
```

---

## 4️⃣ Setup Environment Variables

### Backend Environment File
```bash
cat > backend/.env << 'EOF'
# Database
DATABASE_URL="postgresql://ora_user:ora_password_123@postgres:5432/ora_db"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRES_IN="24h"

# Node Environment
NODE_ENV="production"

# Frontend URL
FRONTEND_URL="https://yourdomain.com"

# Razorpay (if you have keys)
RAZORPAY_KEY_ID="your-razorpay-key"
RAZORPAY_KEY_SECRET="your-razorpay-secret"

# Email (Optional - for order notifications)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# API Port
PORT="5000"
EOF
```

### Frontend Environment File
```bash
cat > frontend/.env.local << 'EOF'
NEXT_PUBLIC_API_URL="https://yourdomain.com/api"
NEXT_PUBLIC_RAZORPAY_KEY="your-razorpay-key"
EOF
```

### Update docker-compose.yml
Replace the existing `docker-compose.yml` with:

```yaml
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    container_name: ora-postgres
    environment:
      POSTGRES_USER: ora_user
      POSTGRES_PASSWORD: ora_password_123
      POSTGRES_DB: ora_db
      POSTGRES_INITDB_ARGS: "-c default_transaction_isolation=read_committed"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    networks:
      - ora-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ora_user -d ora_db"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  # Backend API
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: ora-backend
    depends_on:
      postgres:
        condition: service_healthy
    environment:
      DATABASE_URL: "postgresql://ora_user:ora_password_123@postgres:5432/ora_db"
      JWT_SECRET: ${JWT_SECRET}
      NODE_ENV: production
      FRONTEND_URL: ${FRONTEND_URL}
      RAZORPAY_KEY_ID: ${RAZORPAY_KEY_ID}
      RAZORPAY_KEY_SECRET: ${RAZORPAY_KEY_SECRET}
    ports:
      - "5000:5000"
    volumes:
      - ./backend:/app
      - /app/node_modules
    networks:
      - ora-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    restart: unless-stopped

  # Frontend Application
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      args:
        NEXT_PUBLIC_API_URL: ${NEXT_PUBLIC_API_URL}
        NEXT_PUBLIC_RAZORPAY_KEY: ${NEXT_PUBLIC_RAZORPAY_KEY}
    container_name: ora-frontend
    depends_on:
      - backend
    ports:
      - "3000:3000"
    volumes:
      - ./frontend:/app
      - /app/node_modules
      - /app/.next
    networks:
      - ora-network
    environment:
      NEXT_PUBLIC_API_URL: ${NEXT_PUBLIC_API_URL}
      NEXT_PUBLIC_RAZORPAY_KEY: ${NEXT_PUBLIC_RAZORPAY_KEY}
    restart: unless-stopped

networks:
  ora-network:
    driver: bridge

volumes:
  postgres_data:
```

---

## 5️⃣ Run Docker Compose

### Start All Services
```bash
docker-compose up -d --build
```

### Verify Containers Running
```bash
docker-compose ps
```

Expected output:
```
CONTAINER ID   IMAGE              COMMAND                  STATUS
abc123         ora-backend        "npm start"              Up 2 minutes
def456         ora-frontend       "npm start"              Up 1 minute
ghi789         postgres:15        "postgres"               Up 3 minutes
```

### Check Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

---

## 6️⃣ Setup Nginx Reverse Proxy

### Install Nginx
```bash
apt install -y nginx
```

### Create Nginx Configuration
```bash
cat > /etc/nginx/sites-available/orashop << 'EOF'
upstream backend {
    server backend:5000;
}

upstream frontend {
    server frontend:3000;
}

server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Redirect HTTP to HTTPS (after SSL setup)
    # return 301 https://$server_name$request_uri;

    # API Proxy
    location /api/ {
        proxy_pass http://backend/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Frontend
    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://backend/health;
        access_log off;
    }
}
EOF
```

### Enable Configuration
```bash
ln -s /etc/nginx/sites-available/orashop /etc/nginx/sites-enabled/orashop
rm /etc/nginx/sites-enabled/default

# Test configuration
nginx -t

# Start Nginx
systemctl start nginx
systemctl enable nginx
```

---

## 7️⃣ Setup SSL Certificate (Let's Encrypt)

### Install Certbot
```bash
apt install -y certbot python3-certbot-nginx
```

### Get Certificate
```bash
certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com
```

### Update Nginx for HTTPS
```bash
cat > /etc/nginx/sites-available/orashop << 'EOF'
upstream backend {
    server backend:5000;
}

upstream frontend {
    server frontend:3000;
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS Server
server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Certificates
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # API Proxy
    location /api/ {
        proxy_pass http://backend/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Frontend
    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health check
    location /health {
        proxy_pass http://backend/health;
        access_log off;
    }
}
EOF
```

### Reload Nginx
```bash
nginx -t
systemctl reload nginx
```

### Auto-Renew Certificate
```bash
systemctl enable certbot.timer
systemctl start certbot.timer
```

---

## 8️⃣ Point GoDaddy Domain to VPS

### Get Your VPS IP
```bash
curl ifconfig.me
# Or check VPS provider dashboard
```

### Update GoDaddy DNS

1. **Login to GoDaddy** → Products → Domains
2. **Select your domain** → Manage DNS
3. **Replace nameservers OR add A record:**

#### Option A: A Record (Easier)
- Type: `A`
- Name: `@` (for root)
- Value: `YOUR_VPS_IP`
- TTL: `1 hour`

Add another for `www`:
- Type: `A`
- Name: `www`
- Value: `YOUR_VPS_IP`

#### Option B: Nameservers (Complete)
Point to: (depends on your VPS provider, usually their custom nameservers)

**Allow 15-30 minutes for DNS to propagate.**

### Verify DNS Resolution
```bash
nslookup yourdomain.com
# Should show your VPS IP
```

---

## 9️⃣ Database Setup (First Time Only)

### Run Migrations
```bash
docker-compose exec backend npx prisma migrate deploy
```

### Seed Database
```bash
docker-compose exec backend npx prisma db seed
```

### Access Prisma Studio (Optional)
```bash
docker-compose exec backend npx prisma studio
# Then visit: http://localhost:5555
```

---

## 🔟 Verify Deployment

### Check All Services
```bash
docker-compose ps
curl http://localhost/health
```

### Test Frontend
Visit: `https://yourdomain.com`

### Test API
```bash
curl https://yourdomain.com/api
```

Should return:
```json
{
  "success": true,
  "message": "ORA Jewellery API",
  "tagline": "own. radiate. adorn.",
  "version": "1.0.0"
}
```

---

## 🔄 Daily Operations

### View Logs
```bash
docker-compose logs -f
docker-compose logs -f backend
```

### Restart Services
```bash
docker-compose restart
docker-compose restart backend
```

### Update Code
```bash
cd /opt/orashop
git pull origin main
docker-compose up -d --build
```

### Stop All Services
```bash
docker-compose down
```

### Backup Database
```bash
docker-compose exec postgres pg_dump -U ora_user ora_db > backup.sql
```

---

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Check what's using port 80/443
sudo netstat -tulpn | grep LISTEN

# Kill process
kill -9 PID
```

### Container Won't Start
```bash
docker-compose logs backend
# Check error messages
```

### Database Connection Error
```bash
# Check if postgres is healthy
docker-compose exec postgres psql -U ora_user -d ora_db -c "SELECT 1;"
```

### Domain Not Resolving
```bash
nslookup yourdomain.com
dig yourdomain.com
# If still not working, wait 30 mins for DNS propagation
```

### Nginx Not Proxying Correctly
```bash
# Test nginx config
nginx -t

# Reload
systemctl reload nginx

# Check logs
tail -f /var/log/nginx/error.log
```

---

## 📊 Monitoring

### Check Container Resource Usage
```bash
docker stats
```

### Monitor Logs in Real-Time
```bash
docker-compose logs -f --tail=50
```

### Check Disk Space
```bash
df -h
```

### Check Memory
```bash
free -h
```

---

## 🔐 Security Best Practices

1. **Change default passwords** in `.env`
2. **Enable UFW Firewall**
   ```bash
   ufw allow 22/tcp
   ufw allow 80/tcp
   ufw allow 443/tcp
   ufw enable
   ```

3. **Limit SSH Access**
   ```bash
   # Edit /etc/ssh/sshd_config
   PermitRootLogin no
   systemctl restart sshd
   ```

4. **Regular Backups**
   ```bash
   # Backup database daily
   0 2 * * * docker-compose -f /opt/orashop/docker-compose.yml exec -T postgres pg_dump -U ora_user ora_db > /backups/ora_$(date +\%Y\%m\%d).sql
   ```

5. **Update System Regularly**
   ```bash
   apt update && apt upgrade -y
   ```

---

## 📞 Support & Issues

If you encounter issues:

1. Check logs: `docker-compose logs`
2. Verify environment variables in `.env`
3. Test connectivity: `curl https://yourdomain.com`
4. Check DNS: `nslookup yourdomain.com`
5. Review Nginx: `nginx -t` and logs

---

**Your ORA Jewellery site is now live! 🎉**

**Next Steps:**
- Complete Razorpay payment integration
- Add product images via Cloudinary
- Setup email notifications
- Monitor uptime and performance
