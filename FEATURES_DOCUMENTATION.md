# 📚 EcoLedger Features Documentation

Dokumentasi lengkap fitur-fitur yang sudah diimplementasikan di EcoLedger.

## 🔐 Authentication & Authorization

### User Registration
- **Endpoint**: `POST /api/auth/register`
- **Frontend**: `/register`
- **Features**:
  - Email validation
  - Password hashing dengan bcrypt
  - **Organisasi Management**: Pilih organisasi existing atau buat baru
  - Automatic role assignment (user/admin)
  - Data tersimpan di MongoDB
  - Audit log di Cassandra

**Organisasi Features:**
- Dropdown list organisasi yang sudah ada
- Auto-create organisasi baru jika tidak ditemukan
- Case-insensitive matching untuk nama organisasi
- Menampilkan jumlah anggota per organisasi

### User Login
- **Endpoint**: `POST /api/auth/login`
- **Frontend**: `/login`
- **Features**:
  - JWT token generation
  - Token expiry: 24 hours (configurable)
  - Token tersimpan di localStorage
  - Auto-redirect ke dashboard setelah login
  - Return organisasi data dalam response

### Profile Management
- **Endpoint**: `PUT /api/auth/profile`
- **Frontend**: `/dashboard/pengaturan`
- **Features**:
  - Update nama dan email
  - **Update organisasi**: Join organisasi existing atau buat baru
  - Dropdown autocomplete untuk pilih organisasi
  - Real-time display jumlah anggota organisasi
  - Audit log setiap perubahan

### Role-Based Access Control
- **User Role**: Akses dashboard, catat aktivitas, lihat riwayat sendiri
- **Admin Role**: Semua akses user + admin panel, lihat semua user, audit logs

---

## 🏢 Organisasi Management

### Get Organisasi List
- **Endpoint**: `GET /api/organisasi`
- **Response**: Array of organisasi dengan jumlah anggota
- **Features**:
  - Sorted alphabetically by nama
  - Real-time member count
  - Used in registration & profile forms

### Organisasi Logic
```python
# Auto-create or join existing organisasi
if organisasi_name exists (case-insensitive):
    link user to existing organisasi
else:
    create new organisasi
    link user to new organisasi
    
# All changes logged to Cassandra audit
```

### Database Structure (MongoDB)
```javascript
// Collection: organisasi
{
  "_id": ObjectId,
  "nama": "PT Green Energy",
  "created_at": "2026-01-07T...",
  "created_by": "user_id"
}

// Collection: users (updated)
{
  "_id": ObjectId,
  "email": "user@example.com",
  "name": "John Doe",
  "organisasi_id": "org_id", // Reference to organisasi._id
  "role": "user",
  "created_at": "..."
}
```

---

## 📊 Dashboard

### Main Dashboard (`/dashboard`)

#### Cards Section
1. **Total Emisi Card**
   - Menampilkan sum emisi dari semua aktivitas user
   - Data source: MongoDB aggregation
   - Real-time update

2. **Jumlah Aktivitas Card**
   - Hitung total aktivitas yang tercatat
   - Data source: MongoDB count

3. **Keamanan Data Card**
   - Hash chain verification status
   - Endpoint: `GET /api/verify-chain?user_id={id}`
   - Menampilkan: Valid/Invalid dengan total records

4. **API Status Card**
   - Real-time connection check
   - Menampilkan: Online/Offline

#### Charts Section

**1. Line Chart - Tren Emisi Harian**
- Library: Chart.js (react-chartjs-2)
- Data source: `GET /api/dashboard/stats`
- MongoDB aggregation: Group by date, sum emissions
- X-axis: Tanggal (YYYY-MM-DD)
- Y-axis: Total emisi (kgCO2e)

**2. Pie Chart - Distribusi Emisi per Kategori**
- Data source: `GET /api/dashboard/stats`
- MongoDB aggregation: Group by activity_type, sum emissions
- Menampilkan: Persentase per kategori
- Color-coded untuk setiap kategori

#### Audit Log Table
- Data source: `GET /api/dashboard/logs`
- Cassandra query: Filter by user_id, order by time DESC
- Columns:
  - User email
  - Action type (LOGIN, CREATE, UPDATE, DELETE)
  - Timestamp
  - Status badge
- Display: Last 10 activities

#### Recent Activities
- List 5 aktivitas terakhir
- Data source: `GET /api/activities?page=1&page_size=5`
- Sortir: timestamp DESC

---

## 📝 Activity Management

### Create Activity (`/dashboard/catat-aktivitas`)

**Form Fields:**
- Activity Type (dropdown):
  - Transportasi: Car, Motorbike, Bus, Train, Flight
  - Energi: Electricity, Natural Gas
- Distance/Energy input (number)
- Description (textarea, optional)

**Features:**
1. **Estimate Button** (Preview)
   - Endpoint: `POST /api/estimate`
   - Menampilkan preview emisi sebelum save
   - Tidak menyimpan ke database

2. **Save Button**
   - Endpoint: `POST /api/activities`
   - Call Climatiq API untuk perhitungan emisi
   - Generate hash chain (previous_hash + current_hash)
   - Simpan ke MongoDB
   - Log ke Cassandra audit trail
   - Redirect ke dashboard

**Hash Chain Logic:**
```python
# First activity
previous_hash = "0" * 64

# Next activities
previous_hash = last_activity.current_hash

# Generate current hash
current_hash = sha256(
    previous_hash + 
    user_id + 
    activity_type + 
    str(emission) + 
    timestamp
)
```

### View Activities (`/dashboard/riwayat`)

**Features:**
- Pagination (10 items per page)
- Search by activity type
- Filter by date range
- Sortir by timestamp DESC

**Activity Card Display:**
- Activity type icon
- Emission amount (highlighted)
- Distance/Energy used
- Timestamp
- Description
- Hash verification badge
- Current hash (truncated)

---

## 🔍 Hash Chain Verification

### Blockchain-like Immutability

**Endpoint**: `GET /api/verify-chain`

**Verification Steps:**
1. Retrieve all activities sorted by timestamp
2. For each activity:
   - Recalculate hash from data
   - Compare with stored current_hash
   - Verify previous_hash matches previous activity's current_hash
3. Return: valid/invalid with details

**Frontend Display:**
- ✅ Green badge: "Data Terverifikasi" jika valid
- ❌ Red badge: "Data Tidak Valid" jika ada masalah
- Show total records verified

---

## 📋 Audit Trail (Cassandra)

### Logged Actions

**CREATE**: User membuat aktivitas baru
**UPDATE**: User update data (future feature)
**DELETE**: User delete aktivitas (future feature)
**LOGIN**: User login
**LOGOUT**: User logout
**REGISTER**: User register

### Data Structure
```json
{
  "log_id": "uuid",
  "user_id": "user_id_from_token",
  "action_type": "CREATE|LOGIN|etc",
  "entity": "activity|user",
  "entity_id": "object_id",
  "activity_time": "timestamp",
  "description": "Detail action"
}
```

### Query Performance
- Primary key: log_id (UUID)
- Partitioned by user_id for fast user-specific queries
- TTL: No expiration (permanent audit log)

---

## 🔌 API Integration

### Climatiq API Integration

**Purpose**: Menghitung emisi CO2 dari berbagai aktivitas

**Activity Mapper:**
```python
ACTIVITY_MAP = {
    "car_petrol_medium": {
        "activity_id": "passenger_vehicle-vehicle_type_car-fuel_source_petrol-engine_size_medium-distance_na",
        "parameter": "distance",
        "unit": "km"
    },
    "motorbike": {
        "activity_id": "passenger_vehicle-vehicle_type_motorbike-fuel_source_petrol-engine_size_medium-distance_na",
        "parameter": "distance",
        "unit": "km"
    },
    "electricity_id": {
        "activity_id": "electricity-energy_source_grid_mix-country_id",
        "parameter": "energy",
        "unit": "kWh"
    }
}
```

**Request Flow:**
1. User input activity type + parameter
2. Backend map to Climatiq activity_id
3. Call Climatiq API: `POST https://api.climatiq.io/data/v1/estimate`
4. Parse response: co2e (emission), co2e_unit
5. Save to MongoDB with hash

**Error Handling:**
- Invalid activity type → 400 Bad Request
- Climatiq API down → 503 Service Unavailable
- Invalid Climatiq response → 500 Internal Server Error

---

## 🗄️ Database Schemas

### MongoDB Collections

**Collection: users**
```javascript
{
  _id: ObjectId,
  email: String (unique, indexed),
  hashed_password: String,
  name: String,
  role: String (enum: "user", "admin"),
  created_at: DateTime,
  updated_at: DateTime
}

// Indexes
db.users.createIndex({ email: 1 }, { unique: true })
```

**Collection: activity_logs**
```javascript
{
  _id: ObjectId,
  user_id: ObjectId (indexed),
  activity_type: String,
  emission: Float,
  emission_unit: String (default: "kg CO2e"),
  timestamp: DateTime (indexed),
  previous_hash: String (indexed),
  current_hash: String (indexed, unique),
  distance_km: Float (optional),
  energy_kwh: Float (optional),
  description: String (optional),
  climatiq_data: Object {
    co2e: Float,
    co2e_unit: String,
    activity_id: String,
    constituent_gases: Object
  }
}

// Indexes
db.activity_logs.createIndex({ user_id: 1, timestamp: -1 })
db.activity_logs.createIndex({ current_hash: 1 }, { unique: true })
db.activity_logs.createIndex({ timestamp: -1 })
```

### Cassandra Tables

**Keyspace: eco_logs**
```cql
CREATE KEYSPACE eco_logs 
WITH replication = {
  'class': 'SimpleStrategy', 
  'replication_factor': 1
};
```

**Table: activity_audit**
```cql
CREATE TABLE activity_audit (
  log_id UUID PRIMARY KEY,
  user_id TEXT,
  action_type TEXT,
  entity TEXT,
  entity_id TEXT,
  activity_time TIMESTAMP,
  description TEXT
);

-- Index for user queries
CREATE INDEX ON activity_audit (user_id);
CREATE INDEX ON activity_audit (action_type);
CREATE INDEX ON activity_audit (activity_time);
```

---

## 🎨 Frontend Architecture

### Tech Stack
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Shadcn/ui components
- Chart.js / react-chartjs-2
- Lucide React (icons)

### Key Components

**1. Layout Components**
- `dashboard-layout.tsx` - Main layout dengan sidebar
- `navbar.tsx` - Top navigation bar
- `footer.tsx` - Footer dengan links

**2. Feature Components**
- `dashboard-charts.tsx` - Line & Pie charts
- `dashboard-audit-log.tsx` - Audit log table
- `eco-assistant.tsx` - AI assistant (future)

**3. UI Components (Shadcn)**
- Card, Button, Input, Form
- Table, Badge, Alert
- Dialog, Dropdown Menu
- Chart wrapper

### State Management
- React useState untuk local state
- localStorage untuk JWT token
- No global state (Redux/Zustand) yet

### API Client Pattern
```typescript
class ApiClient {
  private baseURL: string
  private authToken: string | null

  setAuthToken(token: string) {
    this.authToken = token
  }

  private async request<T>(endpoint: string) {
    const headers = {
      'Authorization': `Bearer ${this.authToken}`,
      'Content-Type': 'application/json'
    }
    
    const response = await fetch(`${this.baseURL}${endpoint}`, { headers })
    
    if (response.status === 401) {
      // Auto redirect to login
      window.location.href = '/login'
    }
    
    return response.json()
  }
}
```

---

## 🔒 Security Features

### Password Security
- Bcrypt hashing dengan salt rounds: 12
- Password tidak pernah disimpan plain text
- Password validation: min 8 characters

### Token Security
- JWT dengan HS256 algorithm
- Payload: user_id, email, role
- Expiry: 24 hours (configurable)
- Secret key dari environment variable

### CORS Configuration
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Input Validation
- Pydantic models untuk request validation
- Email format validation
- Numeric range validation
- XSS protection (HTML escape)

---

## 📈 Performance Optimizations

### Database
- Indexed fields untuk query performance
- Pagination untuk large datasets
- Aggregation pipeline untuk statistics

### Frontend
- Code splitting dengan Next.js
- Image optimization
- Lazy loading components
- Debounced search input

### API
- Async/await untuk non-blocking I/O
- Connection pooling (Motor, Cassandra driver)
- Caching untuk activity types

---

## 🧪 Testing Recommendations

### Backend Tests (Unit & Integration)
```python
# test_auth.py
def test_register_user():
    response = client.post("/api/auth/register", json={
        "email": "test@example.com",
        "password": "password123",
        "name": "Test User"
    })
    assert response.status_code == 200

# test_activities.py
def test_create_activity():
    response = client.post("/api/activities", 
        headers={"Authorization": f"Bearer {token}"},
        json={...})
    assert response.status_code == 200
```

### Frontend Tests (Jest + React Testing Library)
```typescript
// dashboard.test.tsx
describe('Dashboard', () => {
  it('renders charts when data is available', () => {
    render(<Dashboard />)
    expect(screen.getByText('Tren Emisi')).toBeInTheDocument()
  })
})
```

---

## 🚀 Future Enhancements

### Planned Features
- [ ] AI-powered emission recommendations
- [ ] Export PDF reports
- [ ] Social sharing features
- [ ] Mobile app (React Native)
- [ ] Multi-language support
- [ ] Data visualization dengan D3.js
- [ ] Real-time notifications
- [ ] Team/Organization accounts
- [ ] API rate limiting
- [ ] Two-factor authentication

---

**Last Updated**: January 5, 2026
**Version**: 1.0.0
