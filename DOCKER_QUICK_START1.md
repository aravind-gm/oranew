# 🐳 DOCKER DEPLOYMENT GUIDE - ORA E-COMMERCE

**Quick Docker Deployment for Production & Development**

---

## 📋 Prerequisites

- Docker Desktop installed (Windows/Mac/Linux)
- Docker Compose v2.0+
- Git (optional, for version control)
- 8GB RAM minimum recommended
- 10GB free disk space

---

## 🚀 Quick Start (5 Minutes)

### Step 1: Clone/Navigate to Project
```bash
cd c:\Users\selvi\Downloads\orashop.in\oranew
```

### Step 2: Create Environment File
```bash
# Copy example env file
copy .env.example .env

# Edit .env with your credentials
notepad .env
```

### Step 3: Build and Start All Services
```bash
# Build and start all containers
docker-compose up -d --build

# View logs
docker-compose logs -f
```

### Step 4: Initialize Database
```bash
# Run database migrations
docker exec ora-backend npx prisma migrate deploy

# (Optional) Seed database with sample data
docker exec ora-backend npm run prisma:seed
```

### Step 5: Access Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Database**: localhost:5432

---

## 📁 Project Structure

```
oranew/
├── backend/
│   ├── Dockerfile              ← Backend container config
│   ├── .dockerignore           ← Files to exclude
│   └── src/                    ← Backend source code
│
├── frontend/
│   ├── Dockerfile              ← Frontend container config
│   ├── .dockerignore           ← Files to exclude
│   └── src/                    ← Frontend source code
│
├── docker-compose.yml          ← Main orchestration file
├── .env                        ← Environment variables
└── .env.example                ← Template for .env
```

---

## ⚙️ Environment Configuration

### Create `.env` File

Create a `.env` file in the root directory with the following:

```env
# Database Configuration
POSTGRES_USER=ora_user
POSTGRES_PASSWORD=ora_strong_password_123
POSTGRES_DB=ora_db

# Backend Configuration
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
JWT_EXPIRES_IN=24h
NODE_ENV=production

# URLs
FRONTEND_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:5000/api

# Razorpay (Get from https://dashboard.razorpay.com/)
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx

# Optional: Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Optional: Cloudinary (for image uploads)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### Production Environment Variables

For production deployment, use strong passwords and real API keys:

```env
# Production Database
POSTGRES_PASSWORD=CHANGE_THIS_TO_STRONG_PASSWORD_123!@#

# Production JWT Secret (generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
JWT_SECRET=your-generated-64-character-hex-string

# Production URLs
FRONTEND_URL=https://yourdomain.com
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api

# Production Razorpay Keys
RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxx
```

---

## 🛠️ Docker Commands

### Building Containers

```bash
# Build all services
docker-compose build

# Build specific service
docker-compose build backend
docker-compose build frontend

# Build with no cache (clean build)
docker-compose build --no-cache

# Build with progress
docker-compose build --progress=plain
```

### Starting Services

```bash
# Start all services in detached mode
docker-compose up -d

# Start with rebuild
docker-compose up -d --build

# Start specific service
docker-compose up -d backend

# Start with logs visible
docker-compose up
```

### Stopping Services

```bash
# Stop all services
docker-compose stop

# Stop specific service
docker-compose stop backend

# Stop and remove containers
docker-compose down

# Stop and remove containers + volumes (DELETES DATABASE!)
docker-compose down -v
```

### Viewing Logs

```bash
# View all logs
docker-compose logs

# Follow logs (live)
docker-compose logs -f

# View specific service logs
docker-compose logs backend
docker-compose logs frontend
docker-compose logs postgres

# Last 100 lines
docker-compose logs --tail=100

# Logs with timestamps
docker-compose logs -f --timestamps
```

### Checking Status

```bash
# List running containers
docker-compose ps

# Check container health
docker-compose ps --format json

# View Docker stats (CPU, Memory)
docker stats ora-backend ora-frontend ora-postgres
```

---

## 🗄️ Database Management

### Running Migrations

```bash
# Apply all pending migrations
docker exec ora-backend npx prisma migrate deploy

# Create new migration
docker exec ora-backend npx prisma migrate dev --name migration_name

# Reset database (WARNING: Deletes all data)
docker exec ora-backend npx prisma migrate reset

# View migration status
docker exec ora-backend npx prisma migrate status
```

### Database Seeding

```bash
# Seed database with sample data
docker exec ora-backend npm run prisma:seed

# Access Prisma Studio (database GUI)
docker exec -it ora-backend npx prisma studio
```

### Database Backup & Restore

```bash
# Backup database
docker exec ora-postgres pg_dump -U ora_user ora_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore database
docker exec -i ora-postgres psql -U ora_user ora_db < backup_20260112_120000.sql

# Copy backup from container
docker cp ora-postgres:/backup.sql ./backup.sql
```

### Direct Database Access

```bash
# Connect to PostgreSQL
docker exec -it ora-postgres psql -U ora_user -d ora_db

# Once connected, run SQL:
# \dt              # List tables
# \d orders        # Describe orders table
# SELECT * FROM users LIMIT 5;
# \q               # Quit
```

---

## 🐞 Debugging & Troubleshooting

### Access Container Shell

```bash
# Backend container
docker exec -it ora-backend sh

# Frontend container
docker exec -it ora-frontend sh

# Database container
docker exec -it ora-postgres sh
```

### View Container Details

```bash
# Inspect container
docker inspect ora-backend

# View container resource usage
docker stats ora-backend

# Check health status
docker inspect --format='{{.State.Health.Status}}' ora-backend
```

### Common Issues

#### Issue 1: Port Already in Use
```bash
# Check what's using the port
netstat -ano | findstr :5000
netstat -ano | findstr :3000

# Kill process (Windows)
taskkill /PID <PID> /F

# Change port in docker-compose.yml
ports:
  - "5001:5000"  # Use 5001 instead
```

#### Issue 2: Database Connection Failed
```bash
# Check if postgres is healthy
docker-compose ps

# View postgres logs
docker-compose logs postgres

# Restart postgres
docker-compose restart postgres

# Check DATABASE_URL in backend
docker exec ora-backend env | grep DATABASE_URL
```

#### Issue 3: Build Fails
```bash
# Clean build with no cache
docker-compose build --no-cache

# Remove old images
docker system prune -a

# Check Docker disk space
docker system df
```

#### Issue 4: Container Keeps Restarting
```bash
# View last 50 log lines
docker-compose logs --tail=50 backend

# Check health status
docker inspect ora-backend | grep -A 10 Health

# Disable auto-restart temporarily
docker update --restart=no ora-backend
```

---

## 🔧 Development vs Production

### Development Mode

```bash
# Use docker-compose.dev.yml for development
docker-compose -f docker-compose.dev.yml up -d

# Enable hot reload with volumes
# Edit docker-compose.dev.yml to mount source code
```

### Production Mode

```bash
# Set production environment
export NODE_ENV=production

# Build production images
docker-compose build --build-arg NODE_ENV=production

# Start with production config
docker-compose up -d
```

---

## 📊 Monitoring & Health Checks

### Health Check Endpoints

```bash
# Backend health
curl http://localhost:5000/health

# Frontend health
curl http://localhost:3000

# Database health
docker exec ora-postgres pg_isready -U ora_user
```

### Container Resource Limits

Edit `docker-compose.yml` to add resource limits:

```yaml
services:
  backend:
    # ... other config
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
```

---

## 🔐 Security Best Practices

### 1. Environment Variables
- ✅ Never commit `.env` to git
- ✅ Use strong passwords (32+ characters)
- ✅ Generate JWT secrets with crypto
- ✅ Use different secrets for dev/prod

### 2. Network Security
```yaml
# Isolate database from external access
services:
  postgres:
    # Remove ports section in production
    # ports:
    #   - "5432:5432"
```

### 3. User Permissions
- ✅ Containers run as non-root users
- ✅ Read-only file systems where possible
- ✅ Limited container capabilities

### 4. Image Security
```bash
# Scan images for vulnerabilities
docker scout cves ora-backend:latest

# Use specific image versions (not :latest)
FROM node:20-alpine  # ✅ Good
FROM node:latest     # ❌ Avoid
```

---

## 🚀 Deployment Workflows

### Local Development

```bash
# 1. Start services
docker-compose up -d

# 2. Watch logs
docker-compose logs -f backend frontend

# 3. Make code changes (may need rebuild)

# 4. Restart changed service
docker-compose restart backend

# 5. Stop when done
docker-compose stop
```

### CI/CD Pipeline

```bash
# 1. Build images
docker-compose build

# 2. Run tests
docker-compose run --rm backend npm test
docker-compose run --rm frontend npm test

# 3. Tag images
docker tag ora-backend:latest registry.example.com/ora-backend:v1.0.0

# 4. Push to registry
docker push registry.example.com/ora-backend:v1.0.0

# 5. Deploy to server
ssh user@server "docker-compose pull && docker-compose up -d"
```

### Production Deployment

```bash
# On production server:

# 1. Pull latest code
git pull origin main

# 2. Update environment variables
nano .env

# 3. Build and deploy
docker-compose up -d --build

# 4. Run migrations
docker exec ora-backend npx prisma migrate deploy

# 5. Verify health
curl http://localhost:5000/health
curl http://localhost:3000

# 6. Monitor logs
docker-compose logs -f --tail=100
```

---

## 📦 Image Management

### View Images

```bash
# List all images
docker images

# List ORA images only
docker images | grep ora

# Image sizes
docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"
```

### Clean Up

```bash
# Remove unused images
docker image prune

# Remove all unused data
docker system prune -a

# Remove specific image
docker rmi ora-backend:latest

# Remove dangling images
docker image prune -f
```

---

## 🔄 Updates & Maintenance

### Updating Application

```bash
# 1. Pull latest code
git pull

# 2. Rebuild containers
docker-compose up -d --build

# 3. Run new migrations
docker exec ora-backend npx prisma migrate deploy

# 4. Verify
docker-compose ps
```

### Updating Dependencies

```bash
# Update package.json then:
docker-compose build --no-cache

# Or update inside container
docker exec ora-backend npm update
docker-compose restart backend
```

### Database Maintenance

```bash
# Vacuum database
docker exec ora-postgres psql -U ora_user -d ora_db -c "VACUUM ANALYZE;"

# Check database size
docker exec ora-postgres psql -U ora_user -d ora_db -c "\l+"

# Backup before maintenance
docker exec ora-postgres pg_dump -U ora_user ora_db > backup_maintenance.sql
```

---

## 📈 Performance Optimization

### Backend Optimization

```dockerfile
# In backend/Dockerfile, ensure multi-stage build:
FROM node:20-alpine AS deps    # Dependencies
FROM node:20-alpine AS builder # Build
FROM node:20-alpine AS runner  # Runtime (smallest)
```

### Frontend Optimization

```javascript
// next.config.js already has:
output: 'standalone'  // Minimal output for Docker
```

### Database Optimization

```yaml
# Add to postgres service in docker-compose.yml:
command:
  - "postgres"
  - "-c"
  - "shared_buffers=256MB"
  - "-c"
  - "max_connections=100"
```

---

## 🎯 Quick Commands Reference

```bash
# Start everything
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop everything
docker-compose down

# Restart service
docker-compose restart backend

# Run migrations
docker exec ora-backend npx prisma migrate deploy

# Seed database
docker exec ora-backend npm run prisma:seed

# Access backend shell
docker exec -it ora-backend sh

# Access database
docker exec -it ora-postgres psql -U ora_user -d ora_db

# Backup database
docker exec ora-postgres pg_dump -U ora_user ora_db > backup.sql

# View stats
docker stats

# Clean up
docker system prune -a
```

---

## 🆘 Support & Resources

### Documentation
- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/compose-file/)
- [Node.js Docker Best Practices](https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md)

### Project Documentation
- `WEEK4_COMPLETION_REPORT.md` - Latest features
- `QUICK_REFERENCE.md` - Project overview
- `COMPLETION_ROADMAP.md` - Full roadmap

### Getting Help
- Check logs: `docker-compose logs -f`
- Inspect containers: `docker inspect ora-backend`
- Health status: `docker-compose ps`

---

## ✅ Post-Deployment Checklist

- [ ] All containers running: `docker-compose ps`
- [ ] Health checks passing
- [ ] Database migrations applied
- [ ] Frontend accessible at http://localhost:3000
- [ ] Backend API accessible at http://localhost:5000
- [ ] Can create user account
- [ ] Can browse products
- [ ] Can add to cart
- [ ] Payment integration working (test mode)
- [ ] Order creation working
- [ ] Logs show no errors

---

## 🎉 Success!

Your ORA E-commerce platform is now running in Docker! 

**Next Steps:**
1. Test all features using `WEEK4_STARTUP_GUIDE.md`
2. Configure production environment variables
3. Set up SSL/TLS for production
4. Configure backups
5. Set up monitoring

---

_Last Updated: January 12, 2026_
