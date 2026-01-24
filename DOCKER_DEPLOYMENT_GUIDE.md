# Docker Deployment Guide - OraBae Shop

## Overview
The OraBae Shop application is configured with a complete Docker setup including services for the database, backend API, and frontend application.

## Current Docker Configuration

### Services Defined in `docker-compose.yml`:

1. **PostgreSQL Database** (`postgres`)
   - Image: `postgres:15-alpine`
   - Container: `ora-postgres`
   - Port: 5432
   - Database: `ora_db`
   - Persistent Volume: `postgres_data`

2. **Backend API** (`backend`)
   - Dockerfile: `./backend/Dockerfile`
   - Container: `ora-backend`
   - Port: 5000
   - Health Check: HTTP `/health` endpoint
   - Environment:
     - `DATABASE_URL`: PostgreSQL connection string
     - `JWT_SECRET`: Authentication secret (change in production)
     - `FRONTEND_URL`: http://localhost:3000
     - `NODE_ENV`: production

3. **Frontend Application** (`frontend`)
   - Dockerfile: `./frontend/Dockerfile`
   - Container: `ora-frontend`
   - Port: 3000
   - Next.js Production Build

### Network
- All services connected via `ora-network` bridge network

## Quick Start Commands

### Build and Start All Services
```bash
cd c:\Users\selvi\Downloads\orashop.in\oranew
docker-compose up -d --build
```

### View Running Containers
```bash
docker ps
```

### View All Containers (including stopped)
```bash
docker ps -a
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### Stop All Services
```bash
docker-compose down
```

### Remove Everything (including volumes)
```bash
docker-compose down -v
```

### Access Database
```bash
docker-compose exec postgres psql -U ora_user -d ora_db
```

## Dockerfile Details

### Backend Dockerfile (Multi-stage Build)
- **Stage 1 (deps)**: Install dependencies and generate Prisma Client
- **Stage 2 (builder)**: Compile TypeScript code
- **Stage 3 (runner)**: Lightweight production image with Express.js server

Features:
- Alpine Linux for minimal image size
- Non-root user (`expressjs:nodejs`)
- Uploads volume for file storage
- OpenSSL support for Prisma

### Frontend Dockerfile (Multi-stage Build)
- **Stage 1 (deps)**: Install npm dependencies
- **Stage 2 (builder)**: Build Next.js production bundle
- **Stage 3 (runner)**: Serve static build with Node.js

Features:
- Alpine Linux
- Non-root user (`nodejs`)
- Optimized for production
- Telemetry disabled

## Environment Variables

Required for production deployment:

```env
# Database
POSTGRES_USER=ora_user
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=ora_db

# Backend
JWT_SECRET=your-production-jwt-secret
JWT_EXPIRES_IN=24h
NODE_ENV=production
FRONTEND_URL=https://your-domain.com
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret
PORT=5000

# Frontend
NEXT_PUBLIC_API_URL=https://api.your-domain.com
```

## Port Mapping

| Service | Internal | External | Description |
|---------|----------|----------|-------------|
| PostgreSQL | 5432 | 5432 | Database |
| Backend | 5000 | 5000 | API Server |
| Frontend | 3000 | 3000 | Web Application |

## Build Status

✅ Backend Dockerfile: Ready
✅ Frontend Dockerfile: Ready  
✅ docker-compose.yml: Configured
✅ Network & Health Checks: Configured

## Next Steps

1. **Build Images**:
   ```bash
   docker-compose build
   ```

2. **Start Services**:
   ```bash
   docker-compose up -d
   ```

3. **Verify Health**:
   ```bash
   docker-compose ps  # Check status
   curl http://localhost:5000/health  # Backend health
   curl http://localhost:3000  # Frontend
   ```

4. **Database Setup** (if first time):
   ```bash
   # Run migrations to create tables
   docker-compose exec backend npx prisma migrate deploy
   
   # Seed database with sample data
   docker-compose exec backend node seed.js
   ```

## Troubleshooting

### Database tables don't exist (404/500 errors on API)
If you see errors like "The table `public.products` does not exist":
```bash
# Run migrations
docker-compose exec backend npx prisma migrate deploy

# Seed the database
docker-compose exec backend node seed.js
```

### Backend won't start
- Check database is running: `docker-compose ps postgres`
- View backend logs: `docker-compose logs backend`
- Ensure DATABASE_URL is correct

### Frontend build takes long
- First build can take 2-5 minutes
- Next.js optimization takes time
- Monitor with: `docker-compose logs -f frontend`

### Port already in use
- Change ports in docker-compose.yml
- Or kill existing process: `docker-compose down`

## Production Considerations

1. **Secrets Management**: Use Docker secrets or environment files
2. **Reverse Proxy**: Add Nginx/Traefik for SSL/TLS
3. **Backup**: Persist PostgreSQL volumes properly
4. **Scaling**: Use Docker Swarm or Kubernetes
5. **Registry**: Push images to Docker Hub/ECR for deployment

## Pushing Images to Docker Hub

### Prerequisites
1. Create a Docker Hub account at https://hub.docker.com/signup
2. Login to Docker Hub:
   ```bash
   docker login
   ```

### Push Images to Docker Hub

1. **Set your Docker Hub username** (replace `yourusername` with your actual username):
   ```bash
   set DOCKER_USERNAME=yourusername
   ```

2. **Build and Push Images**:
   ```bash
   # Build images with your username
   docker-compose build
   
   # Push backend image
   docker push %DOCKER_USERNAME%/oranew-backend:latest
   
   # Push frontend image
   docker push %DOCKER_USERNAME%/oranew-frontend:latest
   ```

3. **Or use a single command**:
   ```bash
   docker-compose push
   ```

### Pull and Run from Docker Hub

On any server with Docker installed:
```bash
# Set your Docker Hub username
set DOCKER_USERNAME=yourusername

# Pull and run
docker-compose pull
docker-compose up -d
```

## Useful Docker Commands

```bash
# Remove unused resources
docker system prune -a

# Remove specific image
docker rmi oranew-backend:latest

# Remove all containers
docker container prune

# View image size
docker images --format "{{.Repository}}:{{.Tag}} {{.Size}}"

# Enter container shell
docker exec -it ora-backend sh
docker exec -it ora-frontend sh

# Tag images for Docker Hub
docker tag oranew-backend:latest yourusername/oranew-backend:latest
docker tag oranew-frontend:latest yourusername/oranew-frontend:latest
```

## Documentation Files

For more detailed information, see:
- [QUICK_START.md](./QUICK_START.md) - Getting started guide
- [SETUP.md](./SETUP.md) - Development setup
- [README.md](./README.md) - Project overview
