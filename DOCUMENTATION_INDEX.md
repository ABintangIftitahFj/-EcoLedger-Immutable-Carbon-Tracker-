# 📖 Dokumentasi EcoLedger - Index

Selamat datang di dokumentasi EcoLedger! Pilih dokumen yang sesuai dengan kebutuhan Anda.

## 🚀 Getting Started

### Untuk Pengguna Baru
1. **[README.md](README.md)** - Overview project, fitur utama, dan tech stack
2. **[QUICK_START.md](QUICK_START.md)** - Panduan cepat untuk mulai menggunakan aplikasi
3. **[SETUP_GUIDE.md](SETUP_GUIDE.md)** - Instalasi dan konfigurasi lengkap

### Untuk Developer
1. **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)** - Deploy dengan Docker Compose
2. **[FEATURES_DOCUMENTATION.md](FEATURES_DOCUMENTATION.md)** - Detail implementasi semua fitur
3. **[API_DOCUMENTATION.md](backend/API_DOCUMENTATION.md)** - Referensi API endpoints

### Untuk Setup Khusus
1. **[CLIMATIQ_SETUP.md](CLIMATIQ_SETUP.md)** - Setup Climatiq API key
2. **[SECRETS_AND_ONBOARDING.md](SECRETS_AND_ONBOARDING.md)** - Konfigurasi credentials
3. **[INTEGRATION_SUCCESS.md](INTEGRATION_SUCCESS.md)** - Test hasil integrasi

---

## 📚 Daftar Dokumentasi

### 1. **README.md**
**Isi**: Project overview, fitur utama, instalasi dasar
**Untuk**: Semua orang yang baru mengenal project
**Highlight**:
- ✅ Fitur-fitur utama EcoLedger
- ✅ Teknologi stack (FastAPI, Next.js, MongoDB, Cassandra)
- ✅ Cara instalasi manual
- ✅ Struktur project

### 2. **QUICK_START.md**
**Isi**: Panduan cepat mulai menggunakan aplikasi
**Untuk**: Developer yang ingin langsung jalankan aplikasi
**Highlight**:
- ⚡ Start dengan Docker Compose (1 command!)
- ⚡ Test API dengan cURL
- ⚡ Monitoring services
- ⚡ URL akses aplikasi

### 3. **DEPLOYMENT_GUIDE.md** ⭐ NEW!
**Isi**: Panduan lengkap deployment production-ready
**Untuk**: DevOps engineer, Production deployment
**Highlight**:
- 🐳 Docker Compose configuration
- 🔐 Security best practices
- 📊 Database backup & restore
- 🐛 Troubleshooting common issues
- 🚀 Production checklist

### 4. **FEATURES_DOCUMENTATION.md** ⭐ NEW!
**Isi**: Dokumentasi detail semua fitur yang sudah diimplementasikan
**Untuk**: Developer yang ingin memahami implementasi
**Highlight**:
- 🔐 Authentication & Authorization (JWT)
- 🏢 **Organisasi Management** (Multi-tenant system)
- 📊 Dashboard dengan Charts (MongoDB aggregation)
- 📋 Audit Trail (Cassandra)
- 🔗 Hash Chain verification
- 🔌 Climatiq API integration
- 🗄️ Database schemas (MongoDB & Cassandra)
- 🎨 Frontend architecture

### 4.1 **ORGANISASI_FEATURE.md** ⭐ NEW!
**Isi**: Dokumentasi lengkap sistem organisasi multi-tenant
**Untuk**: Developer yang ingin memahami fitur organisasi
**Highlight**:
- 🏢 Auto-create/join organisasi system
- 📝 Dropdown autocomplete implementation
- 🔧 Backend helper functions (get_or_create_organisasi)
- 🎨 Frontend components & UX
- 📊 Database schema (MongoDB organisasi collection)
- 🔍 Query examples & use cases
- 🚀 Future enhancements & migration guide

### 4.2 **ADMIN_ORGANISASI_DOCUMENTATION.md** ⭐ NEW!
**Isi**: Dokumentasi admin panel untuk kelola organisasi
**Untuk**: Developer & Admin yang manage organisasi
**Highlight**:
- 🔧 3 Admin endpoints (UPDATE, DELETE, GET members)
- 🎨 Frontend admin page `/admin/organisasi`
- ⚠️ Safety features (force delete parameter)
- 🐛 Bug fixes & troubleshooting guide
- 📊 Complete implementation details
- ✅ Testing checklist
- 🔍 Common issues & solutions
- 📝 Query patterns (string vs ObjectId)

### 5. **API_DOCUMENTATION.md**
**Isi**: Referensi lengkap semua API endpoints
**Untuk**: Frontend developer, API consumers
**Highlight**:
- 📝 Authentication endpoints (register, login)
- 📊 Dashboard endpoints (stats, logs)
- 🚗 Activity endpoints (CRUD)
- 🔍 Verification endpoint
- 📋 Request/response examples dengan cURL

### 6. **INTEGRATION_SUCCESS.md**
**Isi**: Test results dan cara menggunakan fitur
**Untuk**: QA testing, Feature verification
**Highlight**:
- ✅ Status koneksi semua services
- ✅ Test results dengan actual responses
- ✅ Screenshot fitur-fitur
- ✅ Database architecture (MongoDB + Cassandra)

### 7. **CLIMATIQ_SETUP.md**
**Isi**: Setup Climatiq API key dan activity mapping
**Untuk**: Setup awal, Troubleshooting Climatiq errors
**Highlight**:
- 🔑 Cara mendapat API key
- 🗺️ Activity type mapping
- 📊 Emission calculation examples

### 8. **SETUP_GUIDE.md**
**Isi**: Setup manual tanpa Docker
**Untuk**: Development environment setup
**Highlight**:
- 📦 Python virtual environment
- 📦 Node.js dependencies
- 🗄️ MongoDB & Cassandra local setup
- 🔧 Environment variables

---

## 🎯 Roadmap Dokumen

### Dokumen yang Perlu Ditambahkan (Future)
- [ ] **ARCHITECTURE.md** - System architecture diagram
- [ ] **TESTING_GUIDE.md** - Unit test, integration test, E2E test
- [ ] **CONTRIBUTING.md** - Contribution guidelines
- [ ] **CHANGELOG.md** - Version history
- [ ] **TROUBLESHOOTING.md** - Common issues & solutions
- [ ] **API_VERSIONING.md** - API version management
- [ ] **PERFORMANCE_TUNING.md** - Optimization tips

---

## 🔍 Quick Reference

### Menjalankan Aplikasi
```bash
cd infrastructures
docker-compose up -d
```

### Akses Aplikasi
- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- API Docs: http://localhost:8000/docs

### Services Status
```bash
docker-compose ps
docker logs eco_backend -f
```

### Test API
```bash
# Health check
curl http://localhost:8000/api/health

# Login (dapatkan token)
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

---

## 📞 Support & Contact

- **Issues**: [GitHub Issues](https://github.com/your-repo/issues)
- **Email**: your-email@example.com
- **Documentation**: Lihat index di atas

---

## 🎓 Learning Path

### Path 1: Pengguna Baru (Non-Technical)
1. README.md → Pahami apa itu EcoLedger
2. QUICK_START.md → Jalankan aplikasi
3. INTEGRATION_SUCCESS.md → Lihat cara menggunakan fitur

### Path 2: Frontend Developer
1. README.md → Tech stack overview
2. QUICK_START.md → Setup development
3. API_DOCUMENTATION.md → Pelajari API endpoints
4. FEATURES_DOCUMENTATION.md → Pahami frontend architecture

### Path 3: Backend Developer
1. README.md → Project overview
2. SETUP_GUIDE.md → Setup manual
3. FEATURES_DOCUMENTATION.md → Pahami backend logic
4. API_DOCUMENTATION.md → Endpoint implementation

### Path 4: DevOps Engineer
1. QUICK_START.md → Local testing
2. DEPLOYMENT_GUIDE.md → Production deployment
3. FEATURES_DOCUMENTATION.md → Database schemas
4. Troubleshooting section

### Path 5: QA Tester
1. QUICK_START.md → Setup test environment
2. INTEGRATION_SUCCESS.md → Test scenarios
3. API_DOCUMENTATION.md → API test cases
4. FEATURES_DOCUMENTATION.md → Feature acceptance criteria

---

## 📊 Dokumentasi Stats

| Dokumen | Baris | Status | Last Update |
|---------|-------|--------|-------------|
| README.md | ~327 | ✅ Updated | 2026-01-05 |
| QUICK_START.md | ~173 | ✅ Updated | 2026-01-05 |
| DEPLOYMENT_GUIDE.md | ~400 | ✅ New | 2026-01-05 |
| FEATURES_DOCUMENTATION.md | ~600 | ✅ New | 2026-01-05 |
| API_DOCUMENTATION.md | ~459 | ✅ Updated | 2026-01-05 |
| INTEGRATION_SUCCESS.md | ~255 | ✅ Updated | 2026-01-05 |
| CLIMATIQ_SETUP.md | ~150 | ✅ Existing | - |
| SETUP_GUIDE.md | ~200 | ✅ Existing | - |

---

**Total Documentation**: 8 files, ~2500+ lines
**Last Updated**: January 5, 2026
**Version**: 1.0.0

🎉 **Dokumentasi sudah lengkap dan siap digunakan!**
