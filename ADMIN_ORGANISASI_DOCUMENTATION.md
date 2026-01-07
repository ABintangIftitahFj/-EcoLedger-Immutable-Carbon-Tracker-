# Admin Organisasi Management - Documentation

## 📋 Overview
Halaman admin untuk mengelola semua organisasi yang terdaftar di sistem EcoLedger. Admin dapat melihat, mengedit, menghapus organisasi, dan melihat daftar anggota setiap organisasi.

## 🌐 Endpoint API

### 1. Update Organisasi
**PUT** `/api/admin/organisasi/{organisasi_id}?nama_baru={nama}`

Update nama organisasi (Admin only).

**Path Parameters:**
- `organisasi_id` (string, required): ID organisasi yang akan diupdate

**Query Parameters:**
- `nama_baru` (string, optional/required): Nama baru untuk organisasi (akan di-trim whitespace)

**Response:**
```json
{
  "id": "67xxxxx",
  "nama": "PT ABC Indonesia",
  "created_at": "2026-01-07T08:00:00+07:00",
  "jumlah_anggota": 5
}
```

**Error Cases:**
- 400: Nama organisasi tidak boleh kosong
- 404: Organisasi tidak ditemukan
- 400: Nama organisasi sudah digunakan organisasi lain (case-insensitive)

**Implementation Notes:**
- Validasi nama dengan `.strip()` untuk menghapus whitespace
- Duplikasi cek menggunakan case-insensitive regex: `{$regex: "^nama$", $options: "i"}`
- Query members menggunakan string `organisasi_id`: `{"organisasi_id": str(organisasi_id)}`

### 2. Delete Organisasi
**DELETE** `/api/admin/organisasi/{organisasi_id}?force={true|false}`

Hapus organisasi (Admin only). Semua users yang terkait akan memiliki `organisasi_id = null`.

**Path Parameters:**
- `organisasi_id` (string, required): ID organisasi yang akan dihapus

**Query Parameters:**
- `force` (boolean, optional, default: false): Force delete organisasi meskipun memiliki anggota

**Response:**
```json
{
  "message": "Organisasi 'PT ABC' berhasil dihapus",
  "affected_users": 5
}
```

**Error Cases:**
- 404: Organisasi tidak ditemukan
- 400: Organisasi memiliki X anggota. Gunakan force=true untuk tetap menghapus (jika force=false)

**Safety Feature:**
- Jika organisasi memiliki anggota dan `force=false`, akan return error 400
- Frontend otomatis set `force=true` jika ada anggota
- Semua affected users akan kehilangan organisasi (`organisasi_id = null`)

**Implementation Notes:**
- Query count menggunakan string: `{"organisasi_id": str(organisasi_id)}`
- Update users menggunakan string: `{"organisasi_id": str(organisasi_id)}`

### 3. Get Organisasi Members
**GET** `/api/admin/organisasi/{organisasi_id}/members`

Mendapatkan daftar semua anggota organisasi (Admin only).

**Path Parameters:**
- `organisasi_id` (string, required): ID organisasi

**Response:**
```json
{
  "organisasi": {
    "id": "67xxxxx",
    "nama": "PT ABC Indonesia"
  },
  "members": [
    {
      "id": "67yyyyy",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "user",
      "created_at": "2026-01-07T08:00:00+07:00"
    }
  ],
  "total_members": 5
}
```

**Error Cases:**
- 404: Organisasi tidak ditemukan

**Implementation Notes:**
- Query members menggunakan STRING organisasi_id: `{"organisasi_id": str(organisasi_id)}`
- Password field di-exclude dari response: `{"password": 0}`
- Mengembalikan array kosong jika tidak ada members

## 🎨 Frontend - Admin Panel Page

### Lokasi File
`frontend-EcoLedger/app/admin/organisasi/page.tsx`

### Fitur Utama

#### 1. **Daftar Organisasi**
- Tabel menampilkan semua organisasi dengan informasi:
  - Nama organisasi dengan icon Building2
  - Jumlah anggota (badge dengan icon Users)
  - Tanggal dibuat (format: DD MMMM YYYY)
  - Tombol aksi: Lihat Anggota, Edit, Hapus

#### 2. **Search/Filter**
- Input search dengan icon Search
- Filter real-time berdasarkan nama organisasi (case-insensitive)
- Menampilkan jumlah hasil filter vs total

#### 3. **Edit Organisasi**
- Dialog modal untuk edit nama organisasi
- Validasi: nama tidak boleh kosong
- Cek duplikasi nama (backend)
- Toast notification untuk sukses/error
- Auto-reload list setelah update

#### 4. **Delete Organisasi**
- Alert dialog konfirmasi sebelum delete dengan `asChild` pattern (fix hydration error)
- Warning box merah jika organisasi memiliki anggota:
  - "⚠️ Peringatan: X anggota akan terlepas dari organisasi ini"
  - Menjelaskan bahwa users tidak akan memiliki organisasi
- Info hijau jika organisasi kosong:
  - "✓ Organisasi ini tidak memiliki anggota"
- Otomatis kirim `force=true` jika ada anggota
- Toast notification dengan jumlah affected users
- Auto-reload list setelah delete

#### 5. **Lihat Anggota**
- Dialog modal menampilkan daftar members
- Tabel members dengan:
  - Nama
  - Email
  - Role (badge: admin/user)
  - Tanggal bergabung
- Loading state saat fetch data
- Empty state jika belum ada anggota

### State Management
```typescript
// Organisasi list
const [organisasi, setOrganisasi] = useState<Organisasi[]>([])
const [filteredOrganisasi, setFilteredOrganisasi] = useState<Organisasi[]>([])
const [searchQuery, setSearchQuery] = useState("")
const [loading, setLoading] = useState(true)

// Edit state
const [editDialogOpen, setEditDialogOpen] = useState(false)
const [editingOrg, setEditingOrg] = useState<Organisasi | null>(null)
const [editNamaBaru, setEditNamaBaru] = useState("")
const [editLoading, setEditLoading] = useState(false)

// Delete state
const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
const [deletingOrg, setDeletingOrg] = useState<Organisasi | null>(null)
const [deleteLoading, setDeleteLoading] = useState(false)

// Members state
const [membersDialogOpen, setMembersDialogOpen] = useState(false)
const [viewingOrg, setViewingOrg] = useState<Organisasi | null>(null)
const [members, setMembers] = useState<Member[]>([])
const [membersLoading, setMembersLoading] = useState(false)
```

### Authentication Token
Semua API calls menggunakan token dengan fallback:
```typescript
const token = localStorage.getItem("token") || localStorage.getItem("access_token");
```

## 🔗 Navigation

Menu ditambahkan di admin sidebar (`frontend-EcoLedger/app/admin/layout.tsx`):

```tsx
<Link href="/admin/organisasi">
    <Button
        variant={isActive("/admin/organisasi") ? "secondary" : "ghost"}
        className="w-full justify-start gap-3"
    >
        <Building2 className="h-4 w-4" />
        Kelola Organisasi
    </Button>
</Link>
```

**Urutan Menu:**
1. Dashboard Admin
2. Kelola Users
3. Semua Aktivitas
4. **Kelola Organisasi** ← NEW
5. Audit Trail

## 🔐 Security & Authorization

- **Authentication**: JWT token dari localStorage (`token` atau `access_token`)
- **Authorization**: Endpoint admin menggunakan `require_admin` dependency
- **Role Check**: Frontend redirect non-admin ke `/dashboard`
- **Token Fallback**: Semua requests cek kedua key: `token` dan `access_token`
- **Role Check**: Frontend redirect non-admin ke `/dashboard`

## 📊 Audit Logging

Semua operasi admin dicatat dalam audit trail:

### Update Organisasi
```python
log_audit(
    user_id=current_user.user_id,
    action_type="UPDATE",
    entity="organisasi",
    entity_id=organisasi_id,
    changes={"nama": nama_baru},
    description=f"Admin updated organisasi: {old_nama} -> {nama_baru}"
)
```

### Delete Organisasi
```python
log_audit(
    user_id=current_user.user_id,
    action_type="DELETE",
    entity="organisasi",
    entity_id=organisasi_id,
    description=f"Admin deleted organisasi: {org_nama} (affected {affected_users} users)"
)
```

## 🎯 Use Cases

### UC-1: Memperbaiki Typo Nama Organisasi
**Actor**: Admin
1. Admin membuka halaman Kelola Organisasi
2. Admin mencari organisasi yang ingin diperbaiki
3. Admin klik tombol Edit
4. Admin mengubah nama dan klik Simpan
5. Sistem validasi nama tidak duplikat
6. Sistem update nama dan reload list
7. Toast "Organisasi berhasil diupdate"

### UC-2: Menghapus Organisasi yang Tidak Aktif
**Actor**: Admin
1. Admin membuka halaman Kelola Organisasi
2. Admin klik tombol Hapus pada organisasi target
3. Sistem tampilkan warning jika ada anggota
4. Admin konfirmasi delete
5. Sistem set `organisasi_id = null` untuk semua members
6. Sistem hapus organisasi dari database
7. Toast menampilkan jumlah affected users
8. List di-reload

### UC-3: Melihat Anggota Organisasi
**Actor**: Admin
1. Admin membuka halaman Kelola Organisasi
2. Admin klik tombol "Lihat Anggota"
3. Sistem fetch dan tampilkan list members
4. Admin dapat melihat detail setiap member
5. Admin klik Tutup untuk kembali

### UC-4: Mencari Organisasi Spesifik
**Actor**: Admin
1. Admin membuka halaman Kelola Organisasi
2. Admin ketik nama organisasi di search box
3. Sistem filter list secara real-time
4. Sistem tampilkan hasil filter dan total
5. Admin dapat melakukan aksi pada hasil filter

## 🎨 UI Components Used

### Shadcn/ui Components
- `Card`, `CardContent`, `CardHeader`, `CardTitle`
- `Button` (variant: outline, destructive, ghost)
- `Input` (search dengan icon)
- `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableCell`, `TableHead`
- `Dialog`, `DialogContent`, `DialogHeader`, `DialogFooter`
- `AlertDialog` (konfirmasi delete)
- `Label`, `Badge`

### Icons (lucide-react)
- `Building2` - Organisasi icon
- `Users` - Members icon
- `Edit` - Edit button
- `Trash2` - Delete button
- `Search` - Search icon

## 🐛 Error Handling

### Frontend
```typescript
try {
  // API call
} catch (error: any) {
  console.error("Error:", error)
  toast({
    title: "Error",
    description: error.message || "Default error message",
    variant: "destructive",
  })
}
```

### Backend
```python
try:
    # Business logic
except HTTPException:
    raise  # Re-raise HTTP exceptions
except Exception as e:
    logger.error(f"Error: {e}", exc_info=True)
    raise HTTPException(status_code=500, detail=f"Error internal: {str(e)}")
```

## 📝 Toast Notifications

### Success Messages
- "Organisasi berhasil diupdate menjadi 'Nama Baru'"
- "Organisasi 'Nama Org' berhasil dihapus" (dengan affected users count)

### Error Messages
- "Gagal memuat data organisasi"
- "Nama organisasi tidak boleh kosong"
- "Nama organisasi 'X' sudah digunakan"
- "Organisasi tidak ditemukan"
- "Gagal mengupdate organisasi"
- "Gagal menghapus organisasi"
- "Gagal memuat data anggota"

## 🔄 Data Flow

### Load Organisasi List
```
Frontend -> GET /api/organisasi -> MongoDB.organisasi
         -> Count users per org (with str(organisasi_id))
         -> Response with jumlah_anggota
```

### Update Organisasi
```
Frontend -> PUT /api/admin/organisasi/{id}?nama_baru=X (trimmed)
         -> Check org exists (ObjectId)
         -> Validate no duplicate name (case-insensitive regex)
         -> Update organisasi.nama (trimmed value)
         -> Count members with str(organisasi_id)
         -> Log audit trail
         -> Return updated org with jumlah_anggota
```

### Delete Organisasi
```
Frontend -> DELETE /api/admin/organisasi/{id}?force=true
         -> Check org exists (ObjectId)
         -> Count affected users with str(organisasi_id)
         -> Check force parameter if has members
         -> Set users.organisasi_id = null (with str(organisasi_id))
         -> Delete organisasi
         -> Log audit trail with affected count
         -> Return success with affected_users count
```

### Get Members
```
Frontend -> GET /api/admin/organisasi/{id}/members
         -> Check org exists (ObjectId)
         -> Find all users where organisasi_id = str(org_id)  ← KEY FIX
         -> Exclude password field
         -> Return org info + members list + total_members
```

## � Bug Fixes & Troubleshooting

### Issue 1: Members Tidak Muncul (FIXED)
**Problem**: Endpoint `/members` return empty array padahal ada user

**Root Cause**: 
- `organisasi_id` di users collection disimpan sebagai **STRING**
- Backend query menggunakan ObjectId: `{"organisasi_id": organisasi_id}`
- MongoDB tidak menemukan match karena type mismatch

**Solution**:
```python
# ❌ WRONG:
members = await users_collection.find({"organisasi_id": organisasi_id})

# ✅ CORRECT:
members = await users_collection.find({"organisasi_id": str(organisasi_id)})
```

### Issue 2: Edit Nama Tidak Tersimpan (FIXED)
**Problem**: Update organisasi tidak berhasil, no error shown

**Root Cause**: 
1. Parameter `nama_baru` tidak optional tapi frontend kirim via query string
2. Token tidak ditemukan karena hanya cek `localStorage.getItem("token")`
3. Count members menggunakan ObjectId bukan string

**Solution**:
```python
# Backend - make parameter optional with default None
async def update_organisasi(
    organisasi_id: str,
    nama_baru: str = None,  # Add default
    current_user: TokenData = Depends(require_admin)
):
    if not nama_baru or not nama_baru.strip():
        raise HTTPException(status_code=400, detail="Nama tidak boleh kosong")
    
    # Use str() for count
    jumlah_anggota = await users_collection.count_documents(
        {"organisasi_id": str(organisasi_id)}
    )
```

```typescript
// Frontend - check both token keys
const token = localStorage.getItem("token") || localStorage.getItem("access_token");

// Trim value before sending
const response = await fetch(
  `...?nama_baru=${encodeURIComponent(editNamaBaru.trim())}`,
  ...
);
```

### Issue 3: React Hydration Error (FIXED)
**Problem**: Console errors "<p> cannot contain nested <p>" dan "<div> cannot be descendant of <p>"

**Root Cause**: 
- `AlertDialogDescription` renders as `<p>` tag
- Nested `<p>` dan `<div>` inside it (invalid HTML)

**Solution**:
```tsx
// ❌ WRONG:
<AlertDialogDescription>
  <p>Text</p>  {/* <p> inside <p> */}
  <div>Box</div>  {/* <div> inside <p> */}
</AlertDialogDescription>

// ✅ CORRECT:
<AlertDialogDescription asChild>
  <div className="space-y-3">
    <span className="block">Text</span>
    <div>Box</div>
  </div>
</AlertDialogDescription>
```

### Key Implementation Points

1. **Organisasi ID Storage Pattern**:
   ```
   organisasi collection: _id sebagai ObjectId
   users collection: organisasi_id sebagai STRING (bukan ObjectId)
   ```

2. **Query Pattern**:
   ```python
   # Organisasi operations - use ObjectId
   org = await organisasi_collection.find_one({"_id": ObjectId(id)})
   
   # User operations - use STRING
   users = await users_collection.find({"organisasi_id": str(id)})
   ```

3. **Token Authentication**:
   ```typescript
   // Always check both keys for compatibility
   const token = localStorage.getItem("token") || localStorage.getItem("access_token");
   ```

4. **Input Validation**:
   ```python
   # Backend - trim whitespace
   nama_baru = nama_baru.strip()
   
   # Frontend - trim before send
   editNamaBaru.trim()
   ```

## �🚀 Testing Checklist

### Functional Testing
- [x] Load halaman menampilkan semua organisasi
- [x] Search filter bekerja real-time
- [x] Edit nama organisasi berhasil
- [x] Validasi duplikasi nama bekerja
- [x] Delete organisasi tanpa anggota
- [x] Delete organisasi dengan anggota (warning muncul + force parameter)
- [x] View members menampilkan daftar anggota (fix: string organisasi_id)
- [x] View members untuk org kosong (empty state)
- [x] Toast notifications muncul dengan benar
- [x] Loading states ditampilkan
- [x] Error handling bekerja
- [x] Token fallback (token atau access_token)
- [x] Input trimming untuk whitespace

### Security Testing
- [x] Non-admin tidak dapat akses endpoint
- [x] Token validation berfungsi
- [x] Authorization check di frontend
- [x] Audit logging tercatat
- [x] Force parameter untuk safety delete

### UI/UX Testing
- [x] Responsive design
- [x] Modal dialogs dapat ditutup
- [x] Confirmation dialogs jelas dengan warning box
- [x] Loading indicators visible
- [x] Empty states informatif
- [x] Error messages helpful
- [x] No hydration errors (AlertDialog fixed with asChild)

## 📦 Deployment

### Backend Changes
**File modified**: `backend/app.py`

**Added 3 new endpoints**:
1. `PUT /api/admin/organisasi/{id}?nama_baru={nama}` - Update organisasi
2. `DELETE /api/admin/organisasi/{id}?force={bool}` - Delete organisasi
3. `GET /api/admin/organisasi/{id}/members` - Get members list

**Key fixes**:
- All user queries use `str(organisasi_id)` instead of ObjectId
- Parameter `nama_baru` with default None
- Input trimming with `.strip()`
- Force parameter for safe delete
- Proper error handling and audit logging

**No database migration needed** - uses existing collections

### Frontend Changes
**Files added**:
- `frontend-EcoLedger/app/admin/organisasi/page.tsx` (420+ lines)

**Files modified**:
- `frontend-EcoLedger/app/admin/layout.tsx` (added navigation link with Building2 icon)

**Key implementations**:
- Token fallback: `localStorage.getItem("token") || localStorage.getItem("access_token")`
- Input trimming: `editNamaBaru.trim()`
- AlertDialog with `asChild` to fix hydration errors
- Proper loading states for all async operations
- Real-time search filtering
- Toast notifications for all actions

### Docker Deployment
```bash
# Navigate to infrastructures directory
cd infrastructures

# Restart containers to apply changes
docker restart eco_backend
docker restart eco_frontend

# Verify containers are running
docker ps

# Check backend logs
docker logs --tail 50 eco_backend

# Check frontend logs
docker logs --tail 50 eco_frontend
```

### Verification Steps
1. Access admin panel: `http://localhost:3000/admin/organisasi`
2. Test search functionality
3. Test edit organisasi (should update and reload)
4. Test view members (should show members list)
5. Test delete organisasi (should show warning if has members)
6. Check browser console - no hydration errors
7. Check audit trail for logged operations

## 📚 Related Documentation
- [ORGANISASI_FEATURE.md](./ORGANISASI_FEATURE.md) - Core organisasi feature
- [FEATURES_DOCUMENTATION.md](./FEATURES_DOCUMENTATION.md) - All features overview
- [backend/API_DOCUMENTATION.md](./backend/API_DOCUMENTATION.md) - Complete API reference
- [README.md](./README.md) - Project overview

## 🔍 Quick Reference

### Backend Query Patterns
```python
# ✅ Correct patterns for organisasi operations
org = await organisasi_collection.find_one({"_id": ObjectId(org_id)})
count = await users_collection.count_documents({"organisasi_id": str(org_id)})
users = await users_collection.find({"organisasi_id": str(org_id)})
```

### Frontend API Call Pattern
```typescript
const token = localStorage.getItem("token") || localStorage.getItem("access_token");
const response = await fetch(url, {
  headers: { Authorization: `Bearer ${token}` }
});
```

### Common Issues & Solutions
| Issue | Solution |
|-------|----------|
| Members tidak muncul | Use `str(organisasi_id)` in user queries |
| Edit tidak tersimpan | Add `nama_baru: str = None` parameter |
| Hydration error | Use `<AlertDialogDescription asChild>` |
| Token not found | Check both `token` and `access_token` keys |
| Whitespace issues | Use `.strip()` on backend, `.trim()` on frontend |

---

**Last Updated**: January 7, 2026  
**Status**: ✅ Production Ready  
**Version**: 1.0.0
