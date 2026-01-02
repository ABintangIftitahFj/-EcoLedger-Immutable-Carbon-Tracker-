"""
=============================================================================
APP.PY - Aplikasi Utama FastAPI EcoLedger
=============================================================================

File ini adalah entry point aplikasi EcoLedger, berisi:
1. Konfigurasi FastAPI dan middleware
2. Semua endpoint API
3. Event handler startup/shutdown

EcoLedger adalah sistem pelacak emisi karbon yang:
- Menghitung emisi CO2 dari berbagai aktivitas menggunakan Climatiq API
- Menyimpan data dengan hash chain untuk integritas (blockchain-like)
- Menyediakan API RESTful untuk frontend/mobile app

Endpoint yang Tersedia:
-----------------------
GET  /api/health              - Cek kesehatan sistem
POST /api/activities          - Buat aktivitas baru dengan kalkulasi emisi
GET  /api/activities          - Daftar aktivitas (dengan pagination)
GET  /api/activities/{id}     - Detail satu aktivitas
POST /api/estimate            - Hitung emisi tanpa menyimpan (preview)
GET  /api/verify-chain        - Verifikasi integritas hash chain
GET  /api/activity-types      - Daftar tipe aktivitas yang tersedia
GET  /api/emission-factors/search - Cari emission factor di Climatiq

Dokumentasi Interaktif:
-----------------------
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

Author: EcoLedger Team
Version: 1.0.0
=============================================================================
"""

from fastapi import FastAPI, HTTPException, Query, Depends
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from datetime import datetime
from bson import ObjectId
import logging

# Import modul internal
from config import settings
from database import Database, get_db
from models import (
    ActivityCreate,
    ActivityResponse,
    EmissionEstimateRequest,
    EmissionEstimateResponse,
    HealthResponse,
    HashVerificationResponse,
    ActivityListResponse,
    ErrorResponse,
    ClimatiqData,
    UserCreate,
    UserLogin,
    UserResponse,
    TokenResponse
)
from climatiq_service import climatiq_service, ClimatiqAPIError
from activity_mapper import ActivityMapper
from hashing import generate_hash, verify_chain, verify_hash
from auth import (
    get_password_hash,
    verify_password,
    create_access_token,
    get_current_user,
    get_current_active_user,
    get_optional_user,
    require_admin,
    TokenData
)

# =============================================================================
# KONFIGURASI LOGGING
# =============================================================================
# Setup logging untuk monitoring dan debugging aplikasi
# Level diatur dari environment variable (LOG_LEVEL di .env)

logging.basicConfig(
    level=getattr(logging, settings.log_level),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# =============================================================================
# LIFESPAN EVENT HANDLER
# =============================================================================
# Mengelola startup dan shutdown aplikasi menggunakan pattern context manager
# Lebih modern daripada @app.on_event yang deprecated di FastAPI versi baru

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Event handler untuk startup dan shutdown aplikasi.
    
    Context manager ini:
    1. Dijalankan saat aplikasi START (sebelum yield)
    2. Yield = aplikasi berjalan dan melayani request
    3. Dijalankan saat aplikasi STOP (setelah yield)
    
    Digunakan untuk:
    - Koneksi database saat startup
    - Cleanup resources saat shutdown
    """
    # =========================================================================
    # STARTUP: Dijalankan saat aplikasi mulai
    # =========================================================================
    logger.info("Memulai EcoLedger Backend...")
    
    # Koneksi ke MongoDB - wajib sukses atau aplikasi tidak jalan
    await Database.connect()
    
    logger.info("Aplikasi berhasil dijalankan!")
    
    # Yield = serahkan kontrol ke FastAPI untuk melayani request
    yield
    
    # =========================================================================
    # SHUTDOWN: Dijalankan saat aplikasi berhenti
    # =========================================================================
    logger.info("Mematikan EcoLedger Backend...")
    
    # Tutup koneksi database dengan bersih
    await Database.disconnect()
    
    logger.info("Aplikasi berhasil dimatikan.")


# =============================================================================
# INISIALISASI APLIKASI FASTAPI
# =============================================================================
# Buat instance FastAPI dengan metadata untuk dokumentasi

app = FastAPI(
    title="EcoLedger API",
    description="Sistem pelacak emisi karbon dengan integritas blockchain-like",
    version="1.0.0",
    
    # Gunakan lifespan handler untuk startup/shutdown
    lifespan=lifespan,
    
    # URL untuk dokumentasi otomatis
    docs_url="/docs",      # Swagger UI
    redoc_url="/redoc"     # ReDoc
)


# =============================================================================
# MIDDLEWARE CONFIGURATION
# =============================================================================
# Tambahkan middleware untuk fitur tambahan

# CORS (Cross-Origin Resource Sharing)
# Diperlukan agar frontend dari domain berbeda bisa mengakses API ini
app.add_middleware(
    CORSMiddleware,
    
    # Daftar origin yang diizinkan (dari settings.cors_origins)
    # Contoh: ["http://localhost:3000", "https://ecoledger.com"]
    allow_origins=settings.cors_origins,
    
    # Izinkan credential (cookies, authorization headers)
    allow_credentials=True,
    
    # Izinkan semua method HTTP (GET, POST, PUT, DELETE, dll)
    allow_methods=["*"],
    
    # Izinkan semua header
    allow_headers=["*"],
)


# =============================================================================
# ENDPOINT: AUTHENTICATION
# =============================================================================

@app.post(
    "/api/auth/register",
    response_model=TokenResponse,
    tags=["Autentikasi"],
    summary="Registrasi user baru"
)
async def register(user: UserCreate):
    """
    Mendaftarkan user baru ke sistem.
    
    Args:
        user: Data registrasi (email, password, name, role)
    
    Returns:
        TokenResponse: JWT token dan data user
    
    Raises:
        HTTPException 400: Jika email sudah terdaftar
    """
    try:
        db = await get_db()
        users_collection = db["users"]
        
        # Cek apakah email sudah terdaftar
        existing_user = await users_collection.find_one({"email": user.email})
        if existing_user:
            raise HTTPException(
                status_code=400,
                detail="Email sudah terdaftar. Silakan gunakan email lain."
            )
        
        # Hash password
        hashed_password = get_password_hash(user.password)
        
        # Buat dokumen user baru
        now_str = datetime.now().isoformat()
        new_user = {
            "email": user.email,
            "password": hashed_password,
            "name": user.name,
            "role": user.role,
            "created_at": now_str
        }
        
        # Simpan ke database
        result = await users_collection.insert_one(new_user)
        user_id = str(result.inserted_id)
        
        # Buat JWT token
        access_token = create_access_token(
            data={
                "user_id": user_id,
                "email": user.email,
                "role": user.role
            }
        )
        
        logger.info(f"User baru terdaftar: {user.email}")
        
        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            user=UserResponse(
                id=user_id,
                email=user.email,
                name=user.name,
                role=user.role,
                created_at=now_str
            )
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error registrasi: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error internal: {str(e)}")


@app.post(
    "/api/auth/login",
    response_model=TokenResponse,
    tags=["Autentikasi"],
    summary="Login user"
)
async def login(credentials: UserLogin):
    """
    Login user dengan email dan password.
    
    Args:
        credentials: Email dan password
    
    Returns:
        TokenResponse: JWT token dan data user
    
    Raises:
        HTTPException 401: Jika email atau password salah
    """
    try:
        db = await get_db()
        users_collection = db["users"]
        
        # Cari user berdasarkan email
        user = await users_collection.find_one({"email": credentials.email})
        
        if not user:
            raise HTTPException(
                status_code=401,
                detail="Email atau password salah"
            )
        
        # Verifikasi password
        if not verify_password(credentials.password, user["password"]):
            raise HTTPException(
                status_code=401,
                detail="Email atau password salah"
            )
        
        # Buat JWT token
        user_id = str(user["_id"])
        access_token = create_access_token(
            data={
                "user_id": user_id,
                "email": user["email"],
                "role": user["role"]
            }
        )
        
        logger.info(f"User login: {user['email']}")
        
        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            user=UserResponse(
                id=user_id,
                email=user["email"],
                name=user["name"],
                role=user["role"],
                created_at=user["created_at"]
            )
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error login: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error internal: {str(e)}")


@app.get(
    "/api/auth/me",
    response_model=UserResponse,
    tags=["Autentikasi"],
    summary="Data user yang sedang login"
)
async def get_me(current_user: TokenData = Depends(get_current_user)):
    """
    Mendapatkan data user yang sedang login berdasarkan token.
    
    Memerlukan JWT token di header Authorization.
    
    Returns:
        UserResponse: Data user yang login
    """
    try:
        db = await get_db()
        users_collection = db["users"]
        
        # Cari user berdasarkan ID dari token
        user = await users_collection.find_one({"_id": ObjectId(current_user.user_id)})
        
        if not user:
            raise HTTPException(status_code=404, detail="User tidak ditemukan")
        
        return UserResponse(
            id=str(user["_id"]),
            email=user["email"],
            name=user["name"],
            role=user["role"],
            created_at=user["created_at"]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error get me: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error internal: {str(e)}")


# =============================================================================
# ENDPOINT: HEALTH CHECK
# =============================================================================

@app.get(
    "/api/health",
    response_model=HealthResponse,
    tags=["Sistem"],
    summary="Cek kesehatan sistem"
)
async def health_check():
    """
    Endpoint untuk mengecek status kesehatan sistem.
    
    Mengecek:
    1. Status koneksi MongoDB
    2. Status konfigurasi Climatiq API
    
    Berguna untuk:
    - Monitoring (Prometheus, Grafana)
    - Load balancer health check
    - Kubernetes liveness/readiness probe
    
    Returns:
        HealthResponse: Status sistem dengan timestamp
    """
    # Default status
    db_status = "connected"
    climatiq_status = "configured"
    
    # =========================================================================
    # Cek koneksi MongoDB
    # =========================================================================
    try:
        db = await get_db()
        # Ping command untuk test koneksi
        await db.command('ping')
    except Exception as e:
        logger.error(f"Health check database gagal: {e}")
        db_status = "disconnected"
    
    # =========================================================================
    # Cek konfigurasi Climatiq API
    # =========================================================================
    # Cek apakah API key sudah diisi (bukan placeholder)
    if not settings.climatiq_api_key or settings.climatiq_api_key == "your_climatiq_api_key_here":
        climatiq_status = "not_configured"
    
    # Tentukan overall status
    overall_status = "healthy" if db_status == "connected" else "unhealthy"
    
    return HealthResponse(
        status=overall_status,
        timestamp=datetime.now().isoformat(),
        database=db_status,
        climatiq_api=climatiq_status
    )


# =============================================================================
# ENDPOINT: CREATE ACTIVITY
# =============================================================================

@app.post(
    "/api/activities",
    response_model=ActivityResponse,
    tags=["Aktivitas"],
    summary="Buat aktivitas baru dengan kalkulasi emisi otomatis"
)
async def create_activity(activity: ActivityCreate):
    """
    Membuat aktivitas karbon baru dengan kalkulasi emisi otomatis.
    
    Alur Proses:
    1. Validasi activity_type
    2. Panggil Climatiq API untuk hitung emisi
    3. Generate hash untuk integritas data
    4. Simpan ke MongoDB
    5. Return aktivitas yang tersimpan
    
    Hash Chain:
    Setiap aktivitas memiliki 'previous_hash' yang menunjuk ke hash
    aktivitas sebelumnya, membentuk chain seperti blockchain.
    
    Args:
        activity: Data aktivitas dari request body (ActivityCreate)
    
    Returns:
        ActivityResponse: Aktivitas yang tersimpan dengan hash dan emisi
    
    Raises:
        HTTPException 400: Jika activity_type tidak valid
        HTTPException 503: Jika Climatiq API gagal
        HTTPException 500: Jika terjadi error internal
    """
    try:
        # =====================================================================
        # STEP 1: Validasi activity_type
        # =====================================================================
        if not ActivityMapper.is_valid_activity(activity.activity_type):
            raise HTTPException(
                status_code=400,
                detail=f"Tipe aktivitas tidak valid: {activity.activity_type}. "
                       f"Gunakan /api/activity-types untuk melihat daftar yang tersedia."
            )
        
        logger.info(f"Membuat aktivitas untuk user {activity.user_id}")
        
        # =====================================================================
        # STEP 2: Hitung emisi menggunakan Climatiq API
        # =====================================================================
        try:
            climatiq_data = await climatiq_service.estimate_emission(
                activity_type=activity.activity_type,
                distance_km=activity.distance_km,
                energy_kwh=activity.energy_kwh,
                weight_kg=activity.weight_kg,
                money_spent=activity.money_spent
            )
        except ClimatiqAPIError as e:
            # Error dari Climatiq API (key salah, rate limit, dll)
            logger.error(f"Climatiq API error: {e}")
            raise HTTPException(
                status_code=503,
                detail=f"Kalkulasi emisi gagal: {str(e)}"
            )
        
        # Ambil nilai emisi dari response Climatiq
        emission = climatiq_data["co2e"]
        
        # =====================================================================
        # STEP 3: Generate timestamp dan hash
        # =====================================================================
        now_str = datetime.now().isoformat()
        
        # Ambil hash terakhir dari database untuk membuat chain
        db = await get_db()
        collection = db["activity_logs"]
        
        # Cari document terakhir berdasarkan _id (descending)
        last_doc = await collection.find_one(sort=[("_id", -1)])
        
        if last_doc:
            # Ada record sebelumnya, gunakan hash-nya
            prev_hash = last_doc["current_hash"]
        else:
            # Ini record pertama (genesis), gunakan hash nol
            prev_hash = "0" * 64
        
        # Generate hash untuk record ini
        current_hash = generate_hash(
            prev_hash,
            activity.user_id,
            activity.activity_type,
            emission,
            now_str
        )
        
        # =====================================================================
        # STEP 4: Simpan ke MongoDB
        # =====================================================================
        new_doc = {
            "user_id": activity.user_id,
            "activity_type": activity.activity_type,
            "emission": emission,
            "emission_unit": "kg CO2e",
            "timestamp": now_str,
            "previous_hash": prev_hash,
            "current_hash": current_hash,
            "description": activity.description,
            "climatiq_data": climatiq_data,
            # Parameter aktivitas
            "distance_km": activity.distance_km,
            "energy_kwh": activity.energy_kwh,
            "weight_kg": activity.weight_kg,
            "money_spent": activity.money_spent
        }
        
        result = await collection.insert_one(new_doc)
        new_doc["id"] = str(result.inserted_id)
        
        logger.info(f"Aktivitas berhasil dibuat: {new_doc['id']}")
        
        # =====================================================================
        # STEP 5: Return response
        # =====================================================================
        return ActivityResponse(
            id=new_doc["id"],
            user_id=new_doc["user_id"],
            activity_type=new_doc["activity_type"],
            emission=new_doc["emission"],
            emission_unit=new_doc["emission_unit"],
            timestamp=new_doc["timestamp"],
            previous_hash=new_doc["previous_hash"],
            current_hash=new_doc["current_hash"],
            description=new_doc.get("description"),
            climatiq_data=ClimatiqData(**climatiq_data) if climatiq_data else None,
            distance_km=new_doc.get("distance_km"),
            energy_kwh=new_doc.get("energy_kwh"),
            weight_kg=new_doc.get("weight_kg"),
            money_spent=new_doc.get("money_spent")
        )
        
    except HTTPException:
        # Re-raise HTTP exceptions langsung
        raise
    except Exception as e:
        # Unexpected error, log dan return 500
        logger.error(f"Error membuat aktivitas: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error internal: {str(e)}")


# =============================================================================
# ENDPOINT: GET ACTIVITIES (LIST)
# =============================================================================

@app.get(
    "/api/activities",
    response_model=ActivityListResponse,
    tags=["Aktivitas"],
    summary="Daftar aktivitas dengan pagination"
)
async def get_activities(
    user_id: str = Query(None, description="Filter berdasarkan user ID"),
    page: int = Query(1, ge=1, description="Nomor halaman"),
    page_size: int = Query(10, ge=1, le=100, description="Jumlah item per halaman")
):
    """
    Mendapatkan daftar aktivitas dengan pagination dan filter.
    
    Fitur:
    - Filter berdasarkan user_id (opsional)
    - Pagination dengan page dan page_size
    - Diurutkan dari terbaru ke terlama
    
    Args:
        user_id: Filter aktivitas milik user tertentu
        page: Nomor halaman (mulai dari 1)
        page_size: Jumlah item per halaman (max 100)
    
    Returns:
        ActivityListResponse: Daftar aktivitas dengan info pagination
    """
    try:
        db = await get_db()
        collection = db["activity_logs"]
        
        # Build query filter
        query = {}
        if user_id:
            query["user_id"] = user_id
        
        # Hitung total untuk pagination info
        total = await collection.count_documents(query)
        
        # Kalkulasi skip untuk pagination
        skip = (page - 1) * page_size
        
        # Query dengan pagination dan sorting
        cursor = collection.find(query).sort("_id", -1).skip(skip).limit(page_size)
        docs = await cursor.to_list(length=page_size)
        
        # Convert ke response model dengan verifikasi hash
        activities = []
        for doc in docs:
            # Verifikasi hash untuk setiap record
            try:
                is_valid = verify_hash(doc)
                hash_status = "valid" if is_valid else "invalid"
            except Exception as e:
                logger.warning(f"Gagal verifikasi hash untuk {doc['_id']}: {e}")
                is_valid = None
                hash_status = "unverified"
            
            activities.append(ActivityResponse(
                id=str(doc["_id"]),
                user_id=doc["user_id"],
                activity_type=doc["activity_type"],
                emission=doc["emission"],
                emission_unit=doc.get("emission_unit", "kg CO2e"),
                timestamp=doc["timestamp"],
                previous_hash=doc["previous_hash"],
                current_hash=doc["current_hash"],
                description=doc.get("description"),
                climatiq_data=ClimatiqData(**doc["climatiq_data"]) if doc.get("climatiq_data") else None,
                distance_km=doc.get("distance_km"),
                energy_kwh=doc.get("energy_kwh"),
                weight_kg=doc.get("weight_kg"),
                money_spent=doc.get("money_spent"),
                is_valid=is_valid,
                hash_status=hash_status
            ))
        
        return ActivityListResponse(
            total=total,
            page=page,
            page_size=page_size,
            activities=activities
        )
        
    except Exception as e:
        logger.error(f"Error mengambil aktivitas: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error internal: {str(e)}")


# =============================================================================
# ENDPOINT: GET SINGLE ACTIVITY
# =============================================================================

@app.get(
    "/api/activities/{activity_id}",
    response_model=ActivityResponse,
    tags=["Aktivitas"],
    summary="Detail satu aktivitas"
)
async def get_activity(activity_id: str):
    """
    Mendapatkan detail satu aktivitas berdasarkan ID.
    
    Args:
        activity_id: MongoDB ObjectId sebagai string
    
    Returns:
        ActivityResponse: Detail aktivitas
    
    Raises:
        HTTPException 400: Jika format ID tidak valid
        HTTPException 404: Jika aktivitas tidak ditemukan
    """
    try:
        db = await get_db()
        collection = db["activity_logs"]
        
        # Validasi format ObjectId
        try:
            obj_id = ObjectId(activity_id)
        except Exception:
            raise HTTPException(status_code=400, detail="Format ID tidak valid")
        
        # Query database
        doc = await collection.find_one({"_id": obj_id})
        
        if not doc:
            raise HTTPException(status_code=404, detail="Aktivitas tidak ditemukan")
        
        # Verifikasi hash untuk record ini
        try:
            is_valid = verify_hash(doc)
            hash_status = "valid" if is_valid else "invalid"
        except Exception as e:
            logger.warning(f"Gagal verifikasi hash untuk {doc['_id']}: {e}")
            is_valid = None
            hash_status = "unverified"
        
        return ActivityResponse(
            id=str(doc["_id"]),
            user_id=doc["user_id"],
            activity_type=doc["activity_type"],
            emission=doc["emission"],
            emission_unit=doc.get("emission_unit", "kg CO2e"),
            timestamp=doc["timestamp"],
            previous_hash=doc["previous_hash"],
            current_hash=doc["current_hash"],
            description=doc.get("description"),
            climatiq_data=ClimatiqData(**doc["climatiq_data"]) if doc.get("climatiq_data") else None,
            distance_km=doc.get("distance_km"),
            energy_kwh=doc.get("energy_kwh"),
            weight_kg=doc.get("weight_kg"),
            money_spent=doc.get("money_spent"),
            is_valid=is_valid,
            hash_status=hash_status
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error mengambil aktivitas: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error internal: {str(e)}")


# =============================================================================
# ENDPOINT: ESTIMATE EMISSION (PREVIEW)
# =============================================================================

@app.post(
    "/api/estimate",
    response_model=EmissionEstimateResponse,
    tags=["Emisi"],
    summary="Hitung estimasi emisi tanpa menyimpan"
)
async def estimate_emission(request: EmissionEstimateRequest):
    """
    Menghitung estimasi emisi tanpa menyimpan ke database.
    
    Berguna untuk:
    - Preview emisi sebelum user konfirmasi
    - Kalkulasi on-the-fly di frontend
    - Testing tanpa mengotori database
    
    Args:
        request: Data estimasi (activity_type + parameter)
    
    Returns:
        EmissionEstimateResponse: Hasil kalkulasi emisi
    
    Raises:
        HTTPException 400: Jika activity_type tidak valid
        HTTPException 503: Jika Climatiq API gagal
    """
    try:
        # Validasi activity_type
        if not ActivityMapper.is_valid_activity(request.activity_type):
            raise HTTPException(
                status_code=400,
                detail=f"Tipe aktivitas tidak valid: {request.activity_type}"
            )
        
        # Hitung emisi
        try:
            climatiq_data = await climatiq_service.estimate_emission(
                activity_type=request.activity_type,
                distance_km=request.distance_km,
                energy_kwh=request.energy_kwh,
                weight_kg=request.weight_kg,
                money_spent=request.money_spent
            )
        except ClimatiqAPIError as e:
            raise HTTPException(
                status_code=503,
                detail=f"Kalkulasi emisi gagal: {str(e)}"
            )
        
        return EmissionEstimateResponse(
            activity_type=request.activity_type,
            emission=climatiq_data["co2e"],
            emission_unit=climatiq_data["co2e_unit"],
            climatiq_activity_id=climatiq_data["activity_id"],
            parameters=climatiq_data["parameters"]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error estimasi emisi: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error internal: {str(e)}")


# =============================================================================
# ENDPOINT: VERIFY HASH CHAIN
# =============================================================================

@app.get(
    "/api/verify-chain",
    response_model=HashVerificationResponse,
    tags=["Sistem"],
    summary="Verifikasi integritas hash chain"
)
async def verify_hash_chain():
    """
    Memverifikasi integritas seluruh hash chain.
    
    Mengecek apakah:
    1. Semua hash valid (data tidak diubah)
    2. Chain tidak terputus (previous_hash cocok)
    
    Jika ada data yang dimanipulasi, endpoint ini akan mendeteksinya.
    
    Returns:
        HashVerificationResponse: Hasil verifikasi dengan detail
    
    Notes:
        - Untuk database besar, mungkin memakan waktu lama
        - Jalankan di off-peak hours untuk production
    """
    try:
        db = await get_db()
        result = await verify_chain(db)
        
        return HashVerificationResponse(
            valid=result["valid"],
            total_records=result["total_records"],
            message=result["message"],
            invalid_record_id=result.get("invalid_record_id")
        )
        
    except Exception as e:
        logger.error(f"Error verifikasi chain: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error internal: {str(e)}")


# =============================================================================
# ENDPOINT: GET ACTIVITY TYPES
# =============================================================================

@app.get(
    "/api/activity-types",
    tags=["Referensi"],
    summary="Daftar tipe aktivitas yang tersedia"
)
async def get_activity_types():
    """
    Mendapatkan daftar semua tipe aktivitas yang bisa digunakan.
    
    Returns:
        Dict dengan:
        - total: Jumlah total tipe aktivitas
        - categories: Tipe aktivitas dikelompokkan per kategori
        - all_activities: Daftar semua tipe aktivitas
    """
    # Ambil mapping dari ActivityMapper
    activities = ActivityMapper.get_all_activities()
    transport = ActivityMapper.get_transport_activities()
    energy = ActivityMapper.get_energy_activities()
    
    return {
        "total": len(activities),
        "categories": {
            "transportasi": {
                "count": len(transport),
                "activities": list(transport.keys())
            },
            "energi": {
                "count": len(energy),
                "activities": list(energy.keys())
            }
        },
        "all_activities": list(activities.keys())
    }


# =============================================================================
# ENDPOINT: SEARCH EMISSION FACTORS
# =============================================================================

@app.get(
    "/api/emission-factors/search",
    tags=["Emisi"],
    summary="Cari emission factor di database Climatiq"
)
async def search_emission_factors(
    query: str = Query(None, description="Kata kunci pencarian"),
    category: str = Query(None, description="Filter berdasarkan kategori"),
    region: str = Query(None, description="Filter berdasarkan region (contoh: ID, US)"),
    limit: int = Query(10, ge=1, le=100, description="Jumlah maksimal hasil")
):
    """
    Mencari emission factor yang tersedia di Climatiq.
    
    Berguna untuk:
    - Menemukan activity ID yang valid
    - Eksplorasi database Climatiq
    - Debugging ketika kalkulasi gagal
    
    Args:
        query: Kata kunci (contoh: "car", "electricity")
        category: Filter kategori (contoh: "Vehicles")
        region: Filter region/negara (contoh: "ID" untuk Indonesia)
        limit: Jumlah hasil maksimal
    
    Returns:
        Dict dengan hasil pencarian dari Climatiq
    """
    try:
        results = await climatiq_service.search_emission_factors(
            query=query,
            category=category,
            region=region,
            limit=limit
        )
        return results
        
    except ClimatiqAPIError as e:
        raise HTTPException(
            status_code=503,
            detail=f"Pencarian Climatiq gagal: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Error pencarian emission factors: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error internal: {str(e)}")


# =============================================================================
# MAIN: Untuk menjalankan dengan Python langsung
# =============================================================================
# Biasanya dijalankan dengan: uvicorn app:app --reload
# Tapi juga bisa dengan: python app.py

if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "app:app",
        host=settings.app_host,
        port=settings.app_port,
        reload=settings.is_development,
        log_level=settings.log_level.lower()
    )