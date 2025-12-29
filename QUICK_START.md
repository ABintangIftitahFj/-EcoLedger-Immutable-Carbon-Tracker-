# 🚀 Quick Start Guide - EcoLedger

Panduan singkat untuk menjalankan aplikasi EcoLedger.

## ⚡ Cara Tercepat

### 1. Start MongoDB (jika menggunakan Docker)
```bash
cd infrastructures
docker-compose up -d
```

### 2. Jalankan Aplikasi dengan Script
```bash
./start.sh
```

Script akan otomatis:
- ✅ Cek MongoDB
- ✅ Setup virtual environment Python
- ✅ Install dependencies
- ✅ Start backend (port 8000)
- ✅ Start frontend (port 3000)

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

## ✅ Test Koneksi

```bash
# Test backend health
curl http://localhost:8000/api/health

# Test frontend
open http://localhost:3000/dashboard
```

## 🧪 Test API dengan cURL

### Create Activity
```bash
curl -X POST http://localhost:8000/api/activities \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user123",
    "activity_type": "car_petrol_medium",
    "distance_km": 25.5,
    "description": "Test perjalanan"
  }'
```

### Get Activities
```bash
curl http://localhost:8000/api/activities?user_id=user123
```

### Get Activity Types
```bash
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
