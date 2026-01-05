# 🚀 Quick Start Guide - EcoLedger

Panduan singkat untuk menjalankan aplikasi EcoLedger.

## ⚡ Cara Tercepat (Docker Compose)

### 1. Start All Services
```bash
cd infrastructures
docker-compose up -d
```

Docker Compose akan menjalankan:
- ✅ **MongoDB** (port 27017) - Database utama
- ✅ **Cassandra** (port 9042) - Audit trail database
- ✅ **Backend** (port 8000) - FastAPI server
- ✅ **Frontend** (port 3000) - Next.js application

### 2. Cek Status Services
```bash
docker-compose ps
```

Semua container harus dalam status "Up":
```
NAME            STATUS
eco_mongo       Up
eco_cassandra   Up
eco_backend     Up
eco_frontend    Up
```

### 3. Akses Aplikasi
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

### 4. Register & Login
1. Buka http://localhost:3000
2. Klik "Register" dan buat akun baru
3. Login dengan kredensial yang baru dibuat
4. Anda akan diarahkan ke dashboard

## 🔧 Manual Setup (Alternatif)

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r ../infrastructures/requirements.txt
python app.py
```

### Frontend (Terminal baru)
```bash
cd frontend-EcoLedger
pnpm install  # atau npm install
pnpm dev      # atau npm run dev
```

## 🌐 URLs

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs (Swagger)**: http://localhost:8000/docs
- **API Docs (ReDoc)**: http://localhost:8000/redoc

## 🔍 Monitoring Services

### Cek Logs
```bash
# Backend logs
docker logs eco_backend -f

# Frontend logs
docker logs eco_frontend -f

# MongoDB logs
docker logs eco_mongo -f

# Cassandra logs
docker logs eco_cassandra -f
```

### Stop Services
```bash
cd infrastructures
docker-compose down
```

### Restart Services
```bash
docker-compose restart
```

## ✅ Test Koneksi

```bash
# Test backend health
curl http://localhost:8000/api/health

# Atau buka browser
open http://localhost:3000
```

## 🧪 Test API dengan cURL

### 1. Register User
```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User"
  }'
```

### 2. Login
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

Copy `access_token` dari response untuk request berikutnya.

### 3. Create Activity (dengan token)
```bash
curl -X POST http://localhost:8000/api/activities \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "activity_type": "car_petrol_medium",
    "distance_km": 25.5,
    "description": "Test perjalanan"
  }'
```

### 4. Get Dashboard Stats
```bash
curl http://localhost:8000/api/dashboard/stats \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 5. Get Audit Logs
```bash
curl http://localhost:8000/api/dashboard/logs \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```
curl http://localhost:8000/api/activity-types
```

### Estimate Emission (Preview)
```bash
curl -X POST http://localhost:8000/api/estimate \
  -H "Content-Type: application/json" \
  -d '{
    "activity_type": "motorbike",
    "distance_km": 10
  }'
```

### Verify Hash Chain
```bash
curl http://localhost:8000/api/verify-chain
```

## 📱 Penggunaan Frontend

1. **Buka Dashboard**: http://localhost:3000/dashboard
2. **Catat Aktivitas**: Klik tombol "Catat Aktivitas"
3. **Pilih Tipe**: Pilih transportasi atau energi
4. **Input Data**: Masukkan jarak (km) atau energi (kWh)
5. **Estimasi** (opsional): Klik "Hitung Estimasi" untuk preview
6. **Simpan**: Klik "Simpan Aktivitas"
7. **Lihat Riwayat**: Navigasi ke menu "Riwayat"

## 🔑 API Key Climatiq

API key sudah dikonfigurasi di file `.env`:
```
CLIMATIQ_API_KEY=TTSM3C38BS3E7A28K0FY7Y94Q4
```

## 🐛 Troubleshooting Cepat

### MongoDB tidak running
```bash
# Gunakan Docker
cd infrastructures
docker-compose up -d

# Atau install MongoDB lokal
brew install mongodb-community  # macOS
```

### Port sudah digunakan
```bash
# Kill process di port 8000
lsof -ti:8000 | xargs kill -9

# Kill process di port 3000
lsof -ti:3000 | xargs kill -9
```

### Backend error "Module not found"
```bash
cd backend
source venv/bin/activate
pip install -r ../infrastructures/requirements.txt
```

### Frontend error "Cannot find module"
```bash
cd frontend-EcoLedger
rm -rf node_modules package-lock.json
pnpm install
```

## 📊 Contoh Data Test

### Transportasi
- Mobil bensin medium, 25.5 km → ~5.88 kg CO2e
- Motor, 10 km → ~1.23 kg CO2e
- Bus, 15 km → ~0.95 kg CO2e

### Energi
- Listrik Indonesia, 150 kWh → ~90-120 kg CO2e

## 🎯 Next Steps

Setelah aplikasi berjalan:
1. ✅ Test create activity di frontend
2. ✅ Lihat di dashboard apakah data muncul
3. ✅ Cek riwayat aktivitas
4. ✅ Test estimasi emisi
5. ✅ Verifikasi hash chain

---

**Need Help?** Lihat `README.md` untuk dokumentasi lengkap.
