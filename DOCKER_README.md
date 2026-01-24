# 🐳 Docker Deployment - Quick Start

## ⚡ One-Command Deployment

### Windows
```cmd
deploy-docker.bat
```

### Linux/Mac
```bash
chmod +x deploy-docker.sh
./deploy-docker.sh
```

---

## 🚀 Manual Deployment (3 Steps)

### Step 1: Create Environment File
```bash
# Copy example
copy .env.example .env

# Edit with your values
notepad .env
```

**Required Changes in `.env`:**
- Set strong `JWT_SECRET` (min 32 characters)
- Add your Razorpay keys (test or live)
- Change `POSTGRES_PASSWORD` to something secure

### Step 2: Start Docker Containers
```bash
# Build and start everything
docker-compose up -d --build
```

This will start:
- ✅ PostgreSQL database (port 5432)
- ✅ Backend API (port 5000)
- ✅ Frontend web app (port 3000)

### Step 3: Initialize Database
```bash
# Run migrations
docker exec ora-backend npx prisma migrate deploy

# Optional: Add sample data
docker exec ora-backend npm run prisma:seed
```

---

## 🌐 Access Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Health**: http://localhost:5000/health

---

## 📊 Check Status

```bash
# View running containers
docker-compose ps

# View logs (live)
docker-compose logs -f

# View specific service logs
docker-compose logs backend
docker-compose logs frontend
```

---

## 🛠️ Common Commands

```bash
# Stop all services
docker-compose stop

# Start services
docker-compose start

# Restart a service
docker-compose restart backend

# Stop and remove containers
docker-compose down

# Rebuild and restart
docker-compose up -d --build
```

---

## 🐞 Troubleshooting

### Issue: Port Already in Use
```bash
# Check what's using port
netstat -ano | findstr :5000
netstat -ano | findstr :3000

# Change port in docker-compose.yml
ports:
  - "5001:5000"  # Use different port
```

### Issue: Containers Not Starting
```bash
# Check logs
docker-compose logs backend

# Check if Docker is running
docker info

# Restart Docker Desktop
```

### Issue: Database Connection Error
```bash
# Check postgres is healthy
docker-compose ps

# View postgres logs
docker-compose logs postgres

# Restart postgres
docker-compose restart postgres
```

---

## 🔄 Update Application

```bash
# Pull latest code
git pull

# Rebuild and restart
docker-compose up -d --build

# Run new migrations
docker exec ora-backend npx prisma migrate deploy
```

---

## 🗑️ Clean Up

```bash
# Stop and remove containers
docker-compose down

# Remove containers + volumes (DELETES DATABASE!)
docker-compose down -v

# Remove unused images
docker system prune -a
```

---

## 📚 Full Documentation

For detailed information, see:
- **DOCKER_QUICK_START.md** - Complete Docker guide
- **WEEK4_STARTUP_GUIDE.md** - Feature testing guide
- **WEEK4_COMPLETION_REPORT.md** - Week 4 features

---

## ✅ Verification Checklist

After deployment, verify:

- [ ] Frontend loads at http://localhost:3000
- [ ] Backend API responds at http://localhost:5000/health
- [ ] All containers running: `docker-compose ps`
- [ ] No errors in logs: `docker-compose logs`
- [ ] Can register/login
- [ ] Can browse products

---

## 🆘 Need Help?

1. Check logs: `docker-compose logs -f`
2. Check status: `docker-compose ps`
3. See full guide: `DOCKER_QUICK_START.md`

---

**Quick Start Summary:**
```bash
1. copy .env.example .env       # Create config
2. notepad .env                  # Edit credentials
3. docker-compose up -d --build  # Start everything
4. docker exec ora-backend npx prisma migrate deploy  # Init DB
5. Open http://localhost:3000    # Access app
```

---

_Ready in 5 minutes! 🚀_
