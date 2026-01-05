# 🚢 EcoLedger Deployment Guide

Panduan lengkap untuk deploy aplikasi EcoLedger menggunakan Docker.

## 📋 Prerequisites

- Docker 20.x atau lebih baru
- Docker Compose 2.x atau lebih baru
- Port yang tersedia: 3000, 8000, 9042, 27017
- Minimal 4GB RAM untuk semua services

## 🐳 Deployment dengan Docker Compose

### 1. Clone Repository
```bash
git clone <repository-url>
cd -EcoLedger-Immutable-Carbon-Tracker-
```

### 2. Konfigurasi Environment Variables

Pastikan file `.env` sudah ada di root directory dengan konfigurasi yang benar:

```env
# Climatiq API
CLIMATIQ_API_KEY=YOUR_CLIMATIQ_API_KEY

# MongoDB
MONGODB_URI=mongodb://eco_mongo:27017/
MONGODB_DATABASE=eco_ledger_db

# JWT Secret (PENTING: Ganti dengan secret key yang kuat!)
SECRET_KEY=your-super-secret-key-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Cassandra
CASSANDRA_HOST=eco_cassandra
CASSANDRA_KEYSPACE=eco_logs

# App Config
APP_PORT=8000
ALLOWED_ORIGINS=http://localhost:3000
```

### 3. Build dan Start Services

```bash
cd infrastructures
docker-compose up -d --build
```

Proses ini akan:
1. Build Docker images untuk backend dan frontend
2. Pull images untuk MongoDB dan Cassandra
3. Membuat network untuk inter-service communication
4. Start semua containers dengan dependencies yang benar

### 4. Verify Deployment

```bash
# Cek status semua containers
docker-compose ps

# Expected output:
NAME            STATUS    PORTS
eco_mongo       Up        27017/tcp
eco_cassandra   Up        7000/tcp, 7001/tcp, 7199/tcp, 9042/tcp, 9160/tcp
eco_backend     Up        0.0.0.0:8000->8000/tcp
eco_frontend    Up        0.0.0.0:3000->3000/tcp
```

### 5. Initialize Cassandra Schema

Cassandra memerlukan inisialisasi keyspace dan table:

```bash
# Tunggu Cassandra fully started (sekitar 30-60 detik)
sleep 60

# Jalankan init script
docker exec -it eco_cassandra cqlsh -f /init/cassandra_schema.cql
```

Atau manual:
```bash
docker exec -it eco_cassandra cqlsh

# Di CQL shell:
CREATE KEYSPACE IF NOT EXISTS eco_logs 
WITH replication = {'class': 'SimpleStrategy', 'replication_factor': 1};

USE eco_logs;

CREATE TABLE IF NOT EXISTS activity_audit (
    log_id UUID PRIMARY KEY,
    user_id TEXT,
    action_type TEXT,
    entity TEXT,
    entity_id TEXT,
    activity_time TIMESTAMP,
    description TEXT
);
```

### 6. Test Deployment

```bash
# Test backend health
curl http://localhost:8000/api/health

# Expected response:
{
  "status": "healthy",
  "database": "connected",
  "cassandra": "connected"
}

# Test frontend
curl http://localhost:3000
```

## 🔍 Monitoring & Logs

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f eco_backend
docker-compose logs -f eco_frontend
docker-compose logs -f eco_mongo
docker-compose logs -f eco_cassandra
```

### Container Stats

```bash
# Real-time stats
docker stats

# Specific container
docker stats eco_backend
```

## 🔧 Maintenance Commands

### Restart Services

```bash
# Restart semua services
docker-compose restart

# Restart specific service
docker-compose restart eco_backend
```

### Stop Services

```bash
# Stop tanpa menghapus containers
docker-compose stop

# Stop dan hapus containers
docker-compose down

# Stop dan hapus semua data (HATI-HATI!)
docker-compose down -v
```

### Update Application

```bash
# Pull latest code
git pull origin main

# Rebuild dan restart
docker-compose up -d --build
```

## 🗄️ Database Management

### MongoDB Backup

```bash
# Backup database
docker exec eco_mongo mongodump --out=/backup

# Copy backup to host
docker cp eco_mongo:/backup ./mongo_backup_$(date +%Y%m%d)
```

### MongoDB Restore

```bash
# Copy backup to container
docker cp ./mongo_backup eco_mongo:/backup

# Restore
docker exec eco_mongo mongorestore /backup
```

### Cassandra Backup

```bash
# Snapshot
docker exec eco_cassandra nodetool snapshot eco_logs

# Export to CQL
docker exec eco_cassandra cqlsh -e "COPY eco_logs.activity_audit TO '/backup/audit.csv'"
```

## 🔐 Security Best Practices

### 1. Change Default Credentials

Update `.env` dengan credentials yang kuat:
```env
SECRET_KEY=$(openssl rand -hex 32)
MONGODB_USERNAME=your_username
MONGODB_PASSWORD=$(openssl rand -base64 32)
```

### 2. Enable HTTPS

Untuk production, gunakan reverse proxy (Nginx/Traefik) dengan SSL:

```yaml
# docker-compose.prod.yml
services:
  nginx:
    image: nginx:alpine
    ports:
      - "443:443"
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
```

### 3. Network Isolation

Pastikan containers hanya expose port yang diperlukan:
```yaml
# Good: Internal communication only
eco_mongo:
  expose:
    - "27017"
  
# Bad: Exposed to host
eco_mongo:
  ports:
    - "27017:27017"
```

## 📊 Performance Tuning

### MongoDB Optimization

```bash
# Indexing
docker exec -it eco_mongo mongosh

use eco_ledger_db
db.activity_logs.createIndex({ user_id: 1, timestamp: -1 })
db.activity_logs.createIndex({ current_hash: 1 })
```

### Cassandra Tuning

Edit `docker-compose.yaml`:
```yaml
eco_cassandra:
  environment:
    - MAX_HEAP_SIZE=2G
    - HEAP_NEWSIZE=512M
```

## 🐛 Troubleshooting

### Backend Cannot Connect to MongoDB

```bash
# Check network
docker network inspect infrastructures_default

# Check MongoDB logs
docker logs eco_mongo

# Test connection
docker exec eco_backend ping eco_mongo
```

### Cassandra Startup Errors

```bash
# Cassandra needs time to initialize
docker logs eco_cassandra

# If stuck, restart
docker-compose restart eco_cassandra
```

### Frontend Build Errors

```bash
# Clear node_modules
docker-compose down
rm -rf frontend-EcoLedger/node_modules
docker-compose up -d --build
```

### Port Already in Use

```bash
# Find process using port
netstat -ano | findstr :3000
netstat -ano | findstr :8000

# Kill process (Windows PowerShell)
Stop-Process -Id <PID> -Force

# Kill process (Linux/Mac)
kill -9 <PID>
```

## 🚀 Production Deployment Checklist

- [ ] Change `SECRET_KEY` to a strong random value
- [ ] Enable HTTPS with valid SSL certificate
- [ ] Set up database backups (automated)
- [ ] Configure monitoring (Prometheus/Grafana)
- [ ] Set up log aggregation (ELK stack)
- [ ] Enable firewall rules
- [ ] Set resource limits in `docker-compose.yaml`
- [ ] Configure health checks
- [ ] Set up CI/CD pipeline
- [ ] Document disaster recovery plan

## 📞 Support

For deployment issues:
- Check logs: `docker-compose logs -f`
- Check GitHub Issues
- Contact: [Your Email]

---

**Happy Deploying! 🚀**
