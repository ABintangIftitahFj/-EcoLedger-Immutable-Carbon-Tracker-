# 🚀 Setup Guide untuk Tim

Panduan lengkap untuk menjalankan EcoLedger setelah clone repository.

## 📋 Prerequisites

Pastikan sudah install:

### Untuk Semua OS:
- **Git** - https://git-scm.com/downloads
- **Docker Desktop** - https://www.docker.com/products/docker-desktop/
- **Node.js 18+** - https://nodejs.org/
- **Python 3.8+** - https://www.python.org/downloads/

### Package Manager:
- **pnpm** (recommended) atau npm
  ```bash
  npm install -g pnpm
  ```

---

## 📥 Clone Repository

```bash
git clone <repository-url>
cd -EcoLedger-Immutable-Carbon-Tracker-
```

---

## ⚡ Quick Start (Cara Tercepat)

### 🍎 Untuk macOS/Linux:

```bash
chmod +x start.sh
./start.sh
```

### 🪟 Untuk Windows:

```batch
start.bat
```

Script akan otomatis:
- ✅ Start MongoDB (Docker)
- ✅ Setup Python virtual environment
- ✅ Install semua dependencies
- ✅ Start backend (port 8000)
- ✅ Start frontend (port 3000)

---

## 🔧 Manual Setup (Step by Step)

Jika script otomatis error, ikuti langkah manual:

### 1️⃣ Setup MongoDB

```bash
cd infrastructures
docker-compose up -d
cd ..
```

Cek apakah MongoDB running:
```bash
docker ps
# Harus ada container: eco_mongo
```

### 2️⃣ Setup Backend

**macOS/Linux:**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r ../infrastructures/requirements.txt
python app.py
```

**Windows:**
```batch
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r ..\infrastructures\requirements.txt
python app.py
```

Backend akan berjalan di: **http://localhost:8000**

### 3️⃣ Setup Frontend

Buka terminal baru:

**macOS/Linux/Windows:**
```bash
cd frontend-EcoLedger
pnpm install
pnpm dev
```

Frontend akan berjalan di: **http://localhost:3000**

---

## 🌐 URLs

Setelah semua running:

| Service | URL | Keterangan |
|---------|-----|------------|
| **Frontend** | http://localhost:3000 | User interface |
| **Backend API** | http://localhost:8000 | FastAPI server |
| **API Docs (Swagger)** | http://localhost:8000/docs | Interactive API docs |
| **MongoDB GUI** | http://localhost:8081 | Mongo Express (admin/pass) |

---

## 🔑 Environment Variables

File `.env` dan `.env.local` sudah disediakan dengan konfigurasi default.

### Root `.env` (Backend):
```env
CLIMATIQ_API_KEY=TTSM3C38BS3E7A28K0FY7Y94Q4
MONGODB_URI=mongodb://localhost:27017/
MONGODB_DATABASE=eco_ledger_db
```

### `frontend-EcoLedger/.env.local` (Frontend):
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**⚠️ Jangan ubah nilai ini kecuali ada instruksi khusus!**

---

## 🧪 Testing

### Test Backend:
```bash
curl http://localhost:8000/api/health
```

Response harus:
```json
{
  "status": "healthy",
  "database": "connected",
  "climatiq_api": "configured"
}
```

### Test Frontend:
Buka browser: http://localhost:3000/dashboard

---

## 🛑 Stop Services

### Jika pakai script:
- Tekan **Ctrl+C** di terminal

### Jika manual:
1. **Backend**: Ctrl+C di terminal backend
2. **Frontend**: Ctrl+C di terminal frontend
3. **MongoDB Docker**:
   ```bash
   cd infrastructures
   docker-compose down
   ```

---

## ❌ Troubleshooting

### Error: "Port already in use"

**Port 8000 (Backend):**
```bash
# macOS/Linux
lsof -ti:8000 | xargs kill -9

# Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

**Port 3000 (Frontend):**
```bash
# macOS/Linux
lsof -ti:3000 | xargs kill -9

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Error: "MongoDB connection failed"

```bash
# Restart MongoDB
cd infrastructures
docker-compose restart
```

### Error: "Module not found" (Backend)

```bash
cd backend
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r ../infrastructures/requirements.txt
```

### Error: "Cannot find module" (Frontend)

```bash
cd frontend-EcoLedger
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Error: "Python not found"

Install Python 3.8+ dari https://www.python.org/downloads/

Pastikan ditambahkan ke PATH saat install!

---

## 📝 Git Workflow

### Pull Update Terbaru:
```bash
git pull origin main
```

### Setelah Pull, Update Dependencies:

**Backend:**
```bash
cd backend
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r ../infrastructures/requirements.txt
```

**Frontend:**
```bash
cd frontend-EcoLedger
pnpm install
```

### Push Changes:
```bash
git add .
git commit -m "deskripsi perubahan"
git push origin main
```

---

## 📂 File Penting

| File | Fungsi | Wajib Push? |
|------|--------|-------------|
| `start.sh` | Script auto-start (Mac/Linux) | ✅ Ya |
| `start.bat` | Script auto-start (Windows) | ✅ Ya |
| `.env` | Config backend | ✅ Ya |
| `frontend-EcoLedger/.env.local` | Config frontend | ✅ Ya |
| `backend/venv/` | Python virtual env | ❌ Tidak (di .gitignore) |
| `frontend-EcoLedger/node_modules/` | Node dependencies | ❌ Tidak (di .gitignore) |

---

## 🆘 Butuh Bantuan?

1. Baca `README.md` untuk dokumentasi lengkap
2. Baca `QUICK_START.md` untuk panduan singkat
3. Cek `INTEGRATION_SUCCESS.md` untuk status koneksi
4. Tanya di grup tim

---

## ✅ Checklist Setelah Clone

- [ ] Docker Desktop running
- [ ] MongoDB container running (docker ps)
- [ ] Backend running di http://localhost:8000
- [ ] Frontend running di http://localhost:3000
- [ ] Test create activity berhasil
- [ ] Dashboard menampilkan data

Jika semua ✅, artinya setup berhasil! 🎉

---

**Happy Coding! 🌱**
