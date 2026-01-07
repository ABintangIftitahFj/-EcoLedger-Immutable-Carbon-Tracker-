# 🏢 Fitur Organisasi - EcoLedger

Dokumentasi lengkap sistem multi-tenant organisasi di EcoLedger.

## 📋 Overview

Sistem organisasi memungkinkan multiple perusahaan/organisasi untuk menggunakan EcoLedger dengan data yang terpisah. Setiap user dapat tergabung dalam satu organisasi, dan sistem akan otomatis mengelola organisasi yang sudah ada atau membuat yang baru.

## 🎯 Fitur Utama

### 1. Auto-Create/Join Organisasi
- **Smart Matching**: Case-insensitive matching untuk nama organisasi
- **Auto-Create**: Jika organisasi belum ada, sistem otomatis membuat yang baru
- **Auto-Join**: Jika organisasi sudah ada, user langsung terhubung
- **Audit Logging**: Semua perubahan tercatat di Cassandra

### 2. Dropdown Autocomplete
- **Registration Form**: Pilih dari list organisasi atau ketik nama baru
- **Settings Page**: Update organisasi dengan dropdown interactive
- **Real-time Filter**: Filter organisasi saat mengetik
- **Member Count**: Menampilkan jumlah anggota per organisasi

### 3. Organisasi Data Display
- Nama organisasi
- Jumlah anggota
- Tanggal dibuat
- Created by (user ID)

## 🔧 Implementasi Teknis

### Backend Architecture

#### Database Schema (MongoDB)

**Collection: organisasi**
```javascript
{
  "_id": ObjectId("695e0dee3b1fed9a76647b90"),
  "nama": "PT Antam",
  "created_at": "2026-01-07T14:40:30+07:00",
  "created_by": "user_id_who_created"
}

// Index: nama (for fast case-insensitive search)
```

**Collection: users (Updated)**
```javascript
{
  "_id": ObjectId,
  "email": "user@example.com",
  "name": "John Doe",
  "organisasi_id": "695e0dee3b1fed9a76647b90",  // Reference
  "role": "user",
  "created_at": "2026-01-07T..."
}

// Indexes:
// - email (unique)
// - organisasi_id (for fast lookup)
```

#### API Endpoints

**1. Get Organisasi List**
```http
GET /api/organisasi
Response: OrganisasiResponse[]

[
  {
    "id": "695e0dee3b1fed9a76647b90",
    "nama": "PT Antam",
    "created_at": "2026-01-07T14:40:30+07:00",
    "jumlah_anggota": 5
  }
]
```

**2. Register with Organisasi**
```http
POST /api/auth/register
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "organisasi": "PT Antam"  // Optional
}

Response: TokenResponse with organisasi data
{
  "access_token": "jwt_token...",
  "user": {
    "id": "...",
    "organisasi": {
      "id": "...",
      "nama": "PT Antam",
      "jumlah_anggota": 5
    }
  }
}
```

**3. Update Profile with Organisasi**
```http
PUT /api/auth/profile
{
  "name": "John Doe",
  "email": "user@example.com",
  "organisasi": "PT Green Energy"  // Optional
}

Response: UserResponse with updated organisasi
```

#### Helper Functions

**get_or_create_organisasi()**
```python
async def get_or_create_organisasi(db, nama_organisasi: str, created_by_user_id: str):
    """
    Get existing organisasi or create new one.
    
    Logic:
    1. Search organisasi by nama (case-insensitive)
    2. If found: return existing organisasi
    3. If not found: 
       - Create new organisasi
       - Log to Cassandra audit
       - Return new organisasi
    """
    # Case-insensitive regex search
    existing_org = await db.organisasi.find_one({
        "nama": {"$regex": f"^{nama_organisasi}$", "$options": "i"}
    })
    
    if existing_org:
        return existing_org
    
    # Create new
    new_org = {
        "nama": nama_organisasi,
        "created_at": datetime.now(WIB).isoformat(),
        "created_by": created_by_user_id
    }
    result = await db.organisasi.insert_one(new_org)
    
    # Audit log
    log_audit(
        user_id=created_by_user_id,
        action_type="CREATE",
        entity="organisasi",
        entity_id=str(result.inserted_id),
        description=f"Organisasi baru dibuat: {nama_organisasi}"
    )
    
    return new_org
```

**get_organisasi_by_id()**
```python
async def get_organisasi_by_id(db, organisasi_id: str):
    """
    Get organisasi with member count.
    """
    org = await db.organisasi.find_one({"_id": ObjectId(organisasi_id)})
    if not org:
        return None
    
    # Count members
    jumlah_anggota = await db.users.count_documents({
        "organisasi_id": organisasi_id
    })
    
    return {
        "id": str(org["_id"]),
        "nama": org["nama"],
        "created_at": org["created_at"],
        "jumlah_anggota": jumlah_anggota
    }
```

### Frontend Implementation

#### Registration Form

**Features:**
- Input field dengan icon Building2
- Dropdown muncul saat focus atau typing
- Filter real-time berdasarkan input
- Tampilkan jumlah anggota per organisasi
- Info "akan dibuat sebagai organisasi baru" jika tidak ditemukan
- Auto-close dropdown saat klik di luar

**Code Structure:**
```typescript
const [organisasiList, setOrganisasiList] = useState<OrganisasiResponse[]>([])
const [showOrganisasiDropdown, setShowOrganisasiDropdown] = useState(false)

useEffect(() => {
  loadOrganisasiList()
  
  // Close dropdown on outside click
  const handleClickOutside = (e: MouseEvent) => {
    if (!target.closest('#organisasi-container')) {
      setShowOrganisasiDropdown(false)
    }
  }
  document.addEventListener('click', handleClickOutside)
}, [])

const loadOrganisasiList = async () => {
  const data = await apiClient.getOrganisasiList()
  setOrganisasiList(data)
}
```

#### Settings Page

**Features:**
- Sama seperti registration form
- Menampilkan organisasi saat ini
- Info "Tergabung dalam: PT Antam (5 anggota)"
- Update organisasi dengan dropdown

### Cassandra Audit Log

**Updated Schema:**
```cql
CREATE TABLE activity_audit (
    user_id text,
    activity_time timestamp,
    audit_id uuid,
    action_type text,
    entity text,
    entity_id text,
    changes map<text, text>,
    ip_address text,
    user_name text,            -- NEW
    user_organisasi text,      -- NEW
    description text,
    PRIMARY KEY ((user_id), activity_time, audit_id)
) WITH CLUSTERING ORDER BY (activity_time DESC);
```

**Logged Actions:**
- `CREATE` organisasi: Saat organisasi baru dibuat
- `REGISTER` user: Include organisasi info
- `UPDATE` profile: Include perubahan organisasi

## 📊 Use Cases

### Use Case 1: User Baru dengan Organisasi Baru
```
1. User mengisi form registrasi
2. User mengetik "PT Solar Energy" di field organisasi
3. Sistem cek: "PT Solar Energy" belum ada
4. Info ditampilkan: "akan dibuat sebagai organisasi baru"
5. User klik Daftar
6. Backend:
   - Create organisasi "PT Solar Energy"
   - Create user dengan organisasi_id
   - Log ke Cassandra: CREATE organisasi + REGISTER user
7. User berhasil login dengan organisasi terhubung
```

### Use Case 2: User Baru Join Organisasi Existing
```
1. User mengisi form registrasi
2. User klik field organisasi
3. Dropdown muncul dengan list: "PT Antam (1 anggota)"
4. User pilih "PT Antam"
5. User klik Daftar
6. Backend:
   - Find organisasi "PT Antam"
   - Create user dengan organisasi_id existing
   - Log ke Cassandra: REGISTER user with organisasi
7. User login, organisasi menampilkan "PT Antam (2 anggota)"
```

### Use Case 3: User Update Organisasi
```
1. User login dan ke Settings
2. Field organisasi menampilkan "PT Antam"
3. Info: "Tergabung dalam: PT Antam (2 anggota)"
4. User ganti ke "PT Green Energy"
5. User klik Simpan
6. Backend:
   - Find/create "PT Green Energy"
   - Update user.organisasi_id
   - Log ke Cassandra: UPDATE user - organisasi changed
7. Profile terupdate dengan organisasi baru
```

## 🔍 Query Examples

### MongoDB Queries

**Get all users in organisasi:**
```javascript
db.users.find({ 
  organisasi_id: "695e0dee3b1fed9a76647b90" 
}).count()
```

**Get organisasi with case-insensitive search:**
```javascript
db.organisasi.findOne({
  nama: { $regex: "^pt antam$", $options: "i" }
})
```

**Get organisasi list sorted:**
```javascript
db.organisasi.find().sort({ nama: 1 })
```

### Cassandra Queries

**Get organisasi creation logs:**
```cql
SELECT * FROM activity_audit 
WHERE action_type = 'CREATE' 
  AND entity = 'organisasi'
ALLOW FILTERING;
```

**Get user's organisasi changes:**
```cql
SELECT * FROM activity_audit 
WHERE user_id = 'user_id'
  AND action_type = 'UPDATE'
  AND entity = 'user'
  AND changes['organisasi'] IS NOT NULL
ALLOW FILTERING;
```

## 🚀 Future Enhancements

### Planned Features
- [ ] Organisasi Admin Role
- [ ] Organisasi Dashboard (aggregate emissions per org)
- [ ] Organisasi Settings Page
- [ ] Invite System (invite users to organisasi)
- [ ] Organisasi Reports & Analytics
- [ ] Multi-organisasi Support (user in multiple orgs)
- [ ] Organisasi Hierarchy (parent-child relationships)

### Potential Queries
- Total emissions per organisasi
- Top organisasi by emission reduction
- Organisasi leaderboard
- Organisasi activity trends

## 📝 Migration Guide

### Existing Users Migration

Jika sudah ada users sebelum fitur organisasi:

**Option 1: Set to null**
```javascript
db.users.updateMany(
  { organisasi_id: { $exists: false } },
  { $set: { organisasi_id: null } }
)
```

**Option 2: Create default organisasi**
```javascript
// Create "Individual" organisasi
const defaultOrg = db.organisasi.insertOne({
  nama: "Individual",
  created_at: new Date().toISOString(),
  created_by: "system"
})

// Assign all users without org
db.users.updateMany(
  { organisasi_id: { $exists: false } },
  { $set: { organisasi_id: defaultOrg.insertedId.toString() } }
)
```

### Update Cassandra Schema

Run the migration script:
```bash
docker exec -i eco_cassandra cqlsh < update_cassandra_add_organisasi.cql
```

## 🎯 Best Practices

1. **Case-Insensitive Matching**: Always use regex with options "i"
2. **Audit Everything**: Log all organisasi create/update actions
3. **Validation**: Trim whitespace, prevent empty organisasi names
4. **Performance**: Index organisasi_id in users collection
5. **UX**: Show real-time member count, filter dropdown

---

**Last Updated**: January 7, 2026
