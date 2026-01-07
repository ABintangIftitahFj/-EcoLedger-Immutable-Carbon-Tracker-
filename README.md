# EcoLedger - Immutable Carbon Tracker

Sistem pelacak jejak karbon dengan integritas blockchain-like menggunakan Climatiq API untuk kalkulasi emisi otomatis.

## 🚀 Fitur Utama

- ✅ **Kalkulasi Emisi Otomatis** - Integrasi dengan Climatiq API
- ✅ **Hash Chain Blockchain-like** - Data immutable dan terverifikasi
- ✅ **Real-time Dashboard** - Monitoring jejak karbon dengan grafik interaktif
- ✅ **User Authentication** - JWT-based authentication dengan role management
- ✅ **Organisasi Management** - Multi-tenant dengan sistem organisasi
- ✅ **Admin Panel** - Kelola users, aktivitas, organisasi, dan audit trail
- ✅ **Profile Management** - Update profile, organisasi, ganti password, hapus akun
- ✅ **WIB Timezone** - Semua timestamp menggunakan Waktu Indonesia Barat (UTC+7)
- ✅ **Audit Trail** - Cassandra database untuk logging aktivitas permanen
- ✅ **RESTful API** - Backend FastAPI dengan dokumentasi otomatis
- ✅ **Modern Frontend** - Next.js 14 dengan TypeScript & Tailwind CSS
- ✅ **Hybrid Database** - MongoDB untuk data operasional, Cassandra untuk audit logs
- ✅ **Auto Database Init** - Otomatis setup MongoDB & Cassandra via Docker
- ✅ **Advanced Search** - Search di semua data aktivitas (multi-page)

## 📋 Teknologi Stack

### Backend
- **FastAPI** - Modern Python web framework
- **MongoDB** - NoSQL database untuk data aktivitas (Motor async driver)
- **Cassandra** - Distributed database untuk audit trail
- **JWT Authentication** - Secure token-based authentication
- **Climatiq API** - Database emission factor terpercaya
- **Pydantic** - Data validation
- **Uvicorn** - ASGI server

### Frontend
- **Next.js 14** - React framework dengan App Router
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **Shadcn/ui** - High-quality React components
- **Chart.js** - Interactive charts untuk visualisasi data
- **Lucide Icons** - Beautiful icon set

## 🛠️ Instalasi & Setup

### Prerequisites

Pastikan sudah terinstall:
- Python 3.8+ 
- Node.js 18+
- MongoDB (atau gunakan Docker)
- pnpm (atau npm/yarn)

### 1. Clone Repository

```bash
git clone <repository-url>
cd -EcoLedger-Immutable-Carbon-Tracker-
```

### 2. Setup Backend

```bash
# Masuk ke folder backend
cd backend

# Install dependencies Python (gunakan virtual environment)
python -m venv venv
source venv/bin/activate  # Di Windows: venv\Scripts\activate

# Install dari requirements.txt
pip install -r ../infrastructures/requirements.txt
```

### 3. Setup Environment Variables

File `.env` sudah dibuat di root folder dengan konfigurasi:

```bash
# Climatiq API
CLIMATIQ_API_KEY=TTSM3C38BS3E7A28K0FY7Y94Q4

# MongoDB
MONGODB_URI=mongodb://localhost:27017/
MONGODB_DATABASE=eco_ledger_db

# App Config
APP_PORT=8000
ALLOWED_ORIGINS=http://localhost:3000
```

### 4. Setup All Services dengan Docker (Recommended)

```bash
cd infrastructures
docker-compose up -d
```

Ini akan menjalankan:
- ✅ **MongoDB** (port 27017) - Database utama
- ✅ **Cassandra** (port 9042) - Audit trail database  
- ✅ **Mongo Express** (port 8081) - MongoDB Web GUI
- ✅ **Backend** (port 8000) - FastAPI server
- ✅ **Frontend** (port 3000) - Next.js application
- ✅ **DB Init** (one-time) - Auto initialize MongoDB & Cassandra

**Database Initialization:**
Container `db-init` akan otomatis:
1. Membuat collections dan indexes di MongoDB
2. Membuat user admin default (admin@ecoledger.com)
3. Membuat keyspace `eco_logs` di Cassandra
4. Membuat table `activity_audit` untuk audit trail
5. Exit setelah selesai (tidak berjalan terus)

**Opsi Manual (Development):**
Jika ingin run manual tanpa Docker, pastikan MongoDB dan Cassandra sudah running:
- MongoDB: https://www.mongodb.com/try/download/community
- Cassandra: https://cassandra.apache.org/download/

### 5. Setup Frontend

```bash
# Masuk ke folder frontend
cd frontend-EcoLedger

# Install dependencies
pnpm install
# atau: npm install
```

File `.env.local` sudah dibuat dengan:
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## 🚀 Menjalankan Aplikasi

### 1. Jalankan Backend

```bash
# Dari folder backend
cd backend
source venv/bin/activate  # Aktifkan virtual environment

# Jalankan server
python app.py

# Atau dengan uvicorn langsung:
# uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

Backend akan berjalan di: **http://localhost:8000**

**API Documentation:**
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### 2. Jalankan Frontend

```bash
# Dari folder frontend-EcoLedger
cd frontend-EcoLedger

# Development mode
pnpm dev
# atau: npm run dev
```

Frontend akan berjalan di: **http://localhost:3000**

## 📖 Cara Penggunaan

### 1. Register & Login
Buka browser dan kunjungi `http://localhost:3000`

**Test Users (untuk development):**
Gunakan salah satu akun test berikut:
```
Email: budi.santoso@ecoledger.com     Password: budi123
Email: siti.nurhaliza@ecoledger.com   Password: siti123
Email: rina.permata@ecoledger.com     Password: rina123
Email: dedi.kurniawan@ecoledger.com   Password: dedi123
Email: admin@ecoledger.com            Password: admin123 (Admin role)
```

Atau:
- Klik **"Register"** untuk membuat akun baru
- Login dengan email dan password
- JWT token tersimpan di localStorage untuk autentikasi

### 2. Akses Dashboard
Setelah login, Anda akan diarahkan ke dashboard yang menampilkan:
- 📊 **Grafik Tren Emisi** - Line chart emisi harian dari MongoDB
- 🥧 **Grafik Sumber Polusi** - Pie chart kategori emisi
- 📋 **Audit Log Table** - Riwayat aktivitas dari Cassandra
- 🔐 **Hash Chain Verification** - Status integritas data
- ⏰ **Timezone WIB** - Semua waktu ditampilkan dalam WIB (UTC+7)

### 2.1. Kelola Profil (Pengaturan)
Di halaman **"Pengaturan"**, Anda dapat:
- ✏️ **Update Profile** - Ubah nama dan email (langsung sync ke dashboard)
- 🔑 **Ganti Password** - Ubah password dengan verifikasi password lama
- 🗑️ **Hapus Akun** - Hapus akun dan semua data (audit log tetap tersimpan)
  - Konfirmasi ganda untuk keamanan
  - Data operasional dihapus dari MongoDB
  - Audit trail tetap di Cassandra untuk compliance

### 3. Catat Aktivitas
- Navigasi ke **"Catat Aktivitas"**
- Pilih tipe aktivitas (transportasi/energi)
- Masukkan parameter (jarak/energi)
- Klik **"Hitung Estimasi"** untuk preview (opsional)
- Klik **"Simpan Aktivitas"**
- Data otomatis tersimpan ke MongoDB dengan hash chain
- Aktivitas tercatat di Cassandra audit log

### 4. Lihat Riwayat
- Navigasi ke **"Riwayat"**
- Lihat semua aktivitas dengan hash verification
- Gunakan pagination untuk navigasi data
- Filter berdasarkan kategori atau tanggal

## 🔧 API Endpoints

### Health Check
```bash
GET /api/health
```

### Activities
```bash
# Create activity
POST /api/activities
{
  "user_id": "user123",
  "activity_type": "car_petrol_medium",
  "distance_km": 25.5,
  "description": "Perjalanan ke kantor"
}

# Get activities (with pagination)
GET /api/activities?user_id=user123&page=1&page_size=10

# Get single activity
GET /api/activities/{id}
```

### Estimation (Preview)
```bash
POST /api/estimate
{
  "activity_type": "car_petrol_medium",
  "distance_km": 50
}
```

### Verification
```bash
# Verify hash chain integrity
GET /api/verify-chain
```

### Activity Types
```bash
# Get all available activity types
GET /api/activity-types
```

## 🧪 Testing API

### Dengan cURL:
```bash
# Test health
curl http://localhost:8000/api/health

# Create activity
curl -X POST http://localhost:8000/api/activities \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user123",
    "activity_type": "car_petrol_medium",
    "distance_km": 25.5,
    "description": "Test activity"
  }'

# Get activities
curl http://localhost:8000/api/activities?user_id=user123
```

### Dengan Swagger UI:
Buka http://localhost:8000/docs dan test semua endpoint secara interaktif!

## 📊 Activity Types

### Transportasi
- `car_petrol_small/medium/large` - Mobil bensin
- `car_diesel_small/medium/large` - Mobil diesel
- `car_electric` - Mobil listrik
- `car_hybrid` - Mobil hybrid
- `motorbike/motorbike_small/large` - Motor
- `bus` - Bus
- `train` - Kereta
- `subway` - MRT/LRT
- `flight_domestic/short_haul/long_haul` - Pesawat

### Energi
- `electricity_id` - Listrik (grid Indonesia)
- `electricity_grid` - Listrik (generic)
- `natural_gas` - Gas alam

## 🔐 Security Features

- **Hash Chain**: Setiap aktivitas memiliki hash kriptografis
- **Immutability**: Data tidak bisa diubah tanpa merusak chain
- **Verification**: Endpoint `/api/verify-chain` untuk cek integritas
- **CORS**: Configured untuk security

## 🐛 Troubleshooting

### Backend Error: "Climatiq API error"
- Cek API key di `.env` sudah benar
- Cek koneksi internet
- Cek quota Climatiq API

### Frontend Error: "Gagal memuat data"
- Pastikan backend sudah running di port 8000
- Cek CORS settings di backend
- Cek browser console untuk detail error

### MongoDB Connection Error
- Pastikan MongoDB running
- Cek MONGODB_URI di `.env`
- Test koneksi dengan `mongosh` atau MongoDB Compass

### Port Already in Use
```bash
# Backend (port 8000)
lsof -ti:8000 | xargs kill -9

# Frontend (port 3000)
lsof -ti:3000 | xargs kill -9
```

## 📁 Struktur Project

```
.
├── backend/
│   ├── app.py                 # FastAPI application
│   ├── config.py              # Configuration management
│   ├── models.py              # Pydantic models
│   ├── database.py            # MongoDB connection
│   ├── climatiq_service.py    # Climatiq API client
│   ├── activity_mapper.py     # Activity type mapping
│   └── hashing.py             # Hash chain logic
│
├── frontend-EcoLedger/
│   ├── app/                   # Next.js pages
│   ├── components/            # React components
│   ├── lib/
│   │   └── api-client.ts      # API client
│   └── public/                # Static assets
│
├── infrastructures/
│   ├── docker-compose.yaml        # Docker setup
│   ├── init_db.py                 # MongoDB initialization
│   ├── init_cassandra.py          # Cassandra initialization
│   ├── cassandra_schema.cql       # Cassandra schema
│   ├── requirements.txt           # Python dependencies
│   └── update_cassandra_add_organisasi.cql  # Schema update
│
└── .env                           # Environment variables
```

## 📊 Database Schema

### MongoDB Collections

**1. users**
```javascript
{
  "_id": ObjectId,
  "email": "user@example.com",
  "password": "hashed_password",
  "name": "John Doe",
  "organisasi_id": "org_id",  // Reference to organisasi
  "role": "user" | "admin",
  "created_at": "ISO8601"
}
// Indexes: email (unique), organisasi_id
```

**2. organisasi** (NEW)
```javascript
{
  "_id": ObjectId,
  "nama": "PT Green Energy",
  "created_at": "ISO8601",
  "created_by": "user_id"
}
// Index: nama
```

**3. activity_logs**
```javascript
{
  "_id": ObjectId,
  "user_id": "user_id",
  "activity_type": "car_petrol_medium",
  "distance_km": 25.5,
  "emission": 6.75,
  "timestamp": "ISO8601",
  "previous_hash": "sha256...",
  "current_hash": "sha256...",
  "is_valid": true
}
// Indexes: user_id + timestamp, current_hash
```

### Cassandra Tables

**activity_audit**
```cql
CREATE TABLE activity_audit (
    user_id text,
    activity_time timestamp,
    audit_id uuid,
    action_type text,          -- LOGIN, CREATE, UPDATE, etc
    entity text,               -- user, activity, organisasi
    entity_id text,
    changes map<text, text>,
    ip_address text,
    user_name text,            -- NEW
    user_organisasi text,      -- NEW
    description text,
    PRIMARY KEY ((user_id), activity_time, audit_id)
) WITH CLUSTERING ORDER BY (activity_time DESC);
```

## 🎯 Roadmap

- [x] User Authentication (JWT)
- [x] Multi-user support
- [x] **Organisasi Management** - Multi-tenant system
- [x] Data visualization dengan charts (Chart.js)
- [x] Cassandra integration untuk audit log
- [x] Docker Compose deployment
- [x] **Advanced Search** - Search across all data pages
- [ ] Export PDF reports
- [ ] AI-powered recommendations
- [ ] Mobile app (React Native)
- [ ] Real-time notifications
- [ ] Organisasi dashboard & analytics

## 📚 Dokumentasi

Dokumentasi lengkap tersedia di folder root:

- **[DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md)** - Index semua dokumentasi
- **[QUICK_START.md](QUICK_START.md)** - Panduan cepat
- **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)** - Deployment dengan Docker
- **[FEATURES_DOCUMENTATION.md](FEATURES_DOCUMENTATION.md)** - Detail implementasi fitur
- **[ORGANISASI_FEATURE.md](ORGANISASI_FEATURE.md)** - Dokumentasi fitur organisasi
- **[ADMIN_ORGANISASI_DOCUMENTATION.md](ADMIN_ORGANISASI_DOCUMENTATION.md)** - Admin panel organisasi
- **[API_DOCUMENTATION.md](backend/API_DOCUMENTATION.md)** - API reference
- **[INTEGRATION_SUCCESS.md](INTEGRATION_SUCCESS.md)** - Test results

## 👥 Team

EcoLedger Development Team

## 📄 License

[Your License Here]

---

**Happy Carbon Tracking! 🌱**