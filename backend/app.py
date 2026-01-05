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
from datetime import datetime, timedelta
from bson import ObjectId
import logging
from bson import ObjectId
import uuid 
from typing import Optional, List, Dict, Any  # Pastikan Optional ada
from hashing import generate_hash, verify_chain, verify_hash, verify_chain_for_user

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
from cassandra_service import log_audit, get_audit_logs, get_audit_stats
from climate_trace_service import climate_trace_service
from genai_service import gen_ai_service

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
        
        # FR-11: Log audit ke Cassandra
        log_audit(
            user_id=user_id,
            action_type="REGISTER",
            entity="user",
            entity_id=user_id,
            description=f"User baru terdaftar: {user.email}"
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
        
        # FR-11: Log audit ke Cassandra
        log_audit(
            user_id=user_id,
            action_type="LOGIN",
            entity="user",
            entity_id=user_id,
            description=f"User {user['email']} berhasil login"
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
# ENDPOINT: ADMIN - USER MANAGEMENT
# =============================================================================

@app.get(
    "/api/admin/users",
    tags=["Admin"],
    summary="Lihat semua users (Admin only)"
)
async def get_all_users(
    current_user: TokenData = Depends(require_admin)
):
    """
    Mendapatkan daftar semua user yang terdaftar.
    
    Hanya admin yang bisa mengakses endpoint ini.
    
    Returns:
        List of users (tanpa password)
    """
    try:
        db = await get_db()
        users_collection = db["users"]
        
        # Get all users
        users_cursor = users_collection.find({})
        users_list = []
        
        async for user in users_cursor:
            users_list.append({
                "id": str(user["_id"]),
                "email": user["email"],
                "name": user["name"],
                "role": user["role"],
                "created_at": user.get("created_at", "")
            })
        
        logger.info(f"Admin {current_user.email} mengakses daftar users ({len(users_list)} users)")
        
        return {
            "total": len(users_list),
            "users": users_list
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error get all users: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error internal: {str(e)}")


@app.get(
    "/api/admin/stats",
    tags=["Admin"],
    summary="Statistik admin (Admin only)"
)
async def get_admin_stats(
    current_user: TokenData = Depends(require_admin)
):
    """
    Mendapatkan statistik untuk dashboard admin.
    
    Returns:
        total_users, total_activities, total_emission
    """
    try:
        db = await get_db()
        users_collection = db["users"]
        activities_collection = db["activity_logs"]
        
        # Count users
        total_users = await users_collection.count_documents({})
        
        # Count activities
        total_activities = await activities_collection.count_documents({})
        
        # Sum emissions
        pipeline = [
            {"$group": {"_id": None, "total": {"$sum": "$emission"}}}
        ]
        result = await activities_collection.aggregate(pipeline).to_list(1)
        total_emission = result[0]["total"] if result else 0
        
        logger.info(f"Admin {current_user.email} mengakses statistik")
        
        return {
            "total_users": total_users,
            "total_activities": total_activities,
            "total_emission": total_emission
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error get admin stats: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error internal: {str(e)}")


# =============================================================================
# ENDPOINT: AUDIT TRAIL (FR-11 & FR-12)
# =============================================================================
# Data disimpan di Cassandra untuk high-write performance

@app.get(
    "/api/admin/audit-logs",
    tags=["Admin"],
    summary="View Audit Trail (Admin only) - FR-12"
)
async def get_audit_trail(
    user_id: str = Query(None, description="Filter by user ID"),
    limit: int = Query(100, ge=1, le=500, description="Jumlah maksimal record"),
    current_user: TokenData = Depends(require_admin)
):
    """
    Menampilkan audit trail dari Cassandra.
    
    FR-12: View Audit Trail
    - Menampilkan riwayat aktivitas user secara real-time
    - Untuk monitoring keamanan dan investigasi
    - Data diambil dari Cassandra (eco_logs.activity_audit)
    
    Returns:
        List of audit log records
    """
    try:
        # Log akses audit trail
        log_audit(
            user_id=current_user.user_id,
            action_type="READ",
            entity="audit_logs",
            description=f"Admin {current_user.email} mengakses audit trail"
        )
        
        # Get audit logs from Cassandra
        logs = get_audit_logs(user_id=user_id, limit=limit)
        
        return {
            "total": len(logs),
            "logs": logs,
            "source": "cassandra"
        }
        
    except Exception as e:
        logger.error(f"Error get audit trail: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@app.get(
    "/api/admin/audit-stats",
    tags=["Admin"],
    summary="Statistik Audit Log (Admin only)"
)
async def get_audit_statistics(
    current_user: TokenData = Depends(require_admin)
):
    """
    Mendapatkan statistik audit logs dari Cassandra.
    """
    try:
        stats = get_audit_stats()
        return stats
    except Exception as e:
        logger.error(f"Error get audit stats: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


# =============================================================================
# ENDPOINT: CLIMATE TRACE (Global Emissions Data)
# =============================================================================
# Integrasi dengan Climate TRACE API untuk data emisi global

@app.get(
    "/api/climate-trace/countries",
    tags=["Climate TRACE"],
    summary="Get list of countries"
)
async def get_climate_trace_countries():
    """Get list of all countries from Climate TRACE."""
    try:
        countries = await climate_trace_service.get_countries()
        return {"countries": countries}
    except Exception as e:
        logger.error(f"Error get countries: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@app.get(
    "/api/climate-trace/sectors",
    tags=["Climate TRACE"],
    summary="Get list of emission sectors"
)
async def get_climate_trace_sectors():
    """Get list of emission sectors."""
    try:
        sectors = await climate_trace_service.get_sectors()
        return {"sectors": sectors}
    except Exception as e:
        logger.error(f"Error get sectors: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@app.get(
    "/api/climate-trace/rankings/countries",
    tags=["Climate TRACE"],
    summary="Get country emissions rankings"
)
async def get_country_rankings(
    gas: str = Query("co2e_100yr", description="Gas type"),
    year: int = Query(None, description="Year (default: previous year)"),
    continent: str = Query(None, description="Filter by continent")
):
    """
    Get ranking of countries by emissions.
    
    Returns top polluting countries with their emission data.
    """
    try:
        start = str(year) if year else None
        end = str(year) if year else None
        
        data = await climate_trace_service.get_country_rankings(
            gas=gas,
            start=start,
            end=end,
            continent=continent
        )
        return data
    except Exception as e:
        logger.error(f"Error get country rankings: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@app.get(
    "/api/climate-trace/sources",
    tags=["Climate TRACE"],
    summary="Get top emission sources (polluters)"
)
async def get_emission_sources(
    year: int = Query(None, description="Emissions year"),
    gas: str = Query("co2e_100yr", description="Gas type"),
    sector: str = Query(None, description="Filter by sector"),
    country: str = Query(None, description="ISO3 country code (e.g., IDN)"),
    limit: int = Query(50, ge=1, le=100, description="Max results"),
    offset: int = Query(0, ge=0, description="Pagination offset")
):
    """
    Get top emission sources (facilities/assets).
    
    Shows largest polluters globally or filtered by country/sector.
    """
    try:
        sectors = [sector] if sector else None
        
        sources = await climate_trace_service.get_sources(
            year=year,
            gas=gas,
            sectors=sectors,
            country=country,
            limit=limit,
            offset=offset
        )
        return {
            "sources": sources,
            "count": len(sources),
            "filters": {
                "year": year,
                "gas": gas,
                "sector": sector,
                "country": country
            }
        }
    except Exception as e:
        logger.error(f"Error get emission sources: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@app.get(
    "/api/climate-trace/sources/{source_id}",
    tags=["Climate TRACE"],
    summary="Get emission source details"
)
async def get_source_details(
    source_id: int,
    gas: str = Query("co2e_100yr", description="Gas type")
):
    """
    Get detailed info about a specific emission source.
    
    Includes emissions timeseries data.
    """
    try:
        details = await climate_trace_service.get_source_details(
            source_id=source_id,
            gas=gas
        )
        return details
    except Exception as e:
        logger.error(f"Error get source details: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@app.get(
    "/api/climate-trace/indonesia",
    tags=["Climate TRACE"],
    summary="Get Indonesia emissions data"
)
async def get_indonesia_emissions(
    year: int = Query(None, description="Year"),
    limit: int = Query(20, description="Max results")
):
    """
    Get Indonesia's emission data and top polluters.
    
    Convenience endpoint for Indonesia-specific data.
    """
    try:
        # Get Indonesia sources
        sources = await climate_trace_service.get_sources(
            year=year,
            country="IDN",
            limit=limit
        )
        
        return {
            "country": "Indonesia",
            "country_code": "IDN",
            "top_sources": sources,
            "source_count": len(sources)
        }
    except Exception as e:
        logger.error(f"Error get Indonesia emissions: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


# =============================================================================
# ENDPOINT: AI ASSISTANT (Gemini)
# =============================================================================

@app.post(
    "/api/ai/tips",
    tags=["AI Assistant"],
    summary="Get personalized eco-tips from AI"
)
async def get_ai_tips(
    current_user: TokenData = Depends(get_current_active_user)
):
    """
    Generate personalized sustainability tips using Google Gemini AI.
    Analyzes user's recent activities to provide relevant advice.
    """
    logger.info(f"AI Tips requested for user: {current_user.email}")
    try:
        db = await get_db()
        activities_collection = db["activity_logs"]
        
        # Ambil 5 aktivitas terbaru user
        activities_cursor = activities_collection.find(
            {"user_id": current_user.user_id}
        ).sort("timestamp", -1).limit(5)
        
        activities = await activities_cursor.to_list(length=5)
        
        if not activities:
            summary = "User belum memiliki catatan aktivitas emisi karbon."
        else:
            summary = "Aktivitas terbaru:\n"
            for act in activities:
                summary += f"- {act.get('activity_type')}: {act.get('emission')} {act.get('emission_unit', 'kg CO2e')} pada {act.get('timestamp')}\n"
        
        # Generate tips menggunakan Gemini
        tips = await gen_ai_service.generate_carbon_tips(summary)
        
        # Log audit ke Cassandra
        log_audit(
            user_id=current_user.user_id,
            action_type="AI_TIPS",
            entity="ai_assistant",
            description=f"User {current_user.email} mendapatkan tips AI"
        )
        
        return {
            "user": current_user.email,
            "tips": tips
        }
    except Exception as e:
        logger.error(f"Error getting AI tips: {e}", exc_info=True)
        return {
            "user": current_user.email,
            "tips": "Maaf, Eco-Assistant sedang mengalami kendala teknis. Silakan coba lagi nanti."
        }


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
async def create_activity(
    activity: ActivityCreate,
    current_user: TokenData = Depends(get_current_active_user)
):
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
        
        logger.info(f"Membuat aktivitas untuk user {current_user.user_id}")
        
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
            current_user.user_id,
            activity.activity_type,
            emission,
            now_str
        )
        
        # =====================================================================
        # STEP 4: Simpan ke MongoDB
        # =====================================================================
        new_doc = {
            "user_id": current_user.user_id,
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
async def verify_hash_chain(
    user_id: Optional[str] = Query(None, description="Filter verifikasi untuk user tertentu"),
    current_user: TokenData = Depends(get_current_active_user)  # ← Sudah benar TokenData
):
    """
    Memverifikasi integritas hash chain.
    Bisa difilter berdasarkan user_id atau verifikasi semua (admin only).
    """
    try:
        db = await get_db()
        
        # Jika ada user_id parameter, verifikasi hanya untuk user tersebut
        if user_id:
            # ✅ FIX: Gunakan attribute access, bukan dictionary
            if current_user.role != "admin" and current_user.user_id != user_id:
                raise HTTPException(status_code=403, detail="Anda hanya bisa verifikasi data sendiri")
            
            # Verifikasi chain untuk user tertentu
            result = await verify_chain_for_user(db, user_id)
        else:
            # Verifikasi seluruh chain (hanya admin)
            if current_user.role != "admin":
                raise HTTPException(status_code=403, detail="Hanya admin yang bisa verifikasi seluruh chain")
            result = await verify_chain(db)
        
        return HashVerificationResponse(
            valid=result["valid"],
            total_records=result["total_records"],
            message=result["message"],
            invalid_record_id=result.get("invalid_record_id")
        )
        
    except HTTPException:
        raise
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


# ==========================================
# ENDPOINT DASHBOARD (VERSI FIX OBJECTID & LOG)
# ==========================================

# ==========================================
# ENDPOINT DASHBOARD (MongoDB & Cassandra)
# ==========================================

@app.get("/api/dashboard/stats")
async def get_dashboard_stats(current_user: TokenData = Depends(get_current_active_user)):
    """Mendapatkan statistik untuk dashboard charts (MongoDB)."""
    user_id = current_user.user_id
    logger.info(f"Dashboard stats request for user: {user_id}")
    
    try:
        # Get database instance
        db = await get_db()
        activities_collection = db["activity_logs"]
        
        # Convert user_id to ObjectId for comparison
        try:
            user_obj = ObjectId(user_id)
        except:
            user_obj = user_id
        
        # Find all activities for this user
        activities_cursor = activities_collection.find({
            "$or": [{"user_id": user_id}, {"user_id": user_obj}]
        })
        activities = await activities_cursor.to_list(length=None)
        
        logger.info(f"Found {len(activities)} activities for user {user_id}")
        
        # Process data manually in Python
        pie_data = {}  # Format: {'Transport': 100, 'Electricity': 50}
        line_data = {}  # Format: {'2026-01-04': 150}
        
        for act in activities:
            # Get category & emission
            activity_type = act.get("activity_type", "Other")
            emission = float(act.get("emission", 0))
            
            # Get date (format YYYY-MM-DD)
            timestamp_raw = act.get("timestamp")
            if isinstance(timestamp_raw, str):
                date_str = timestamp_raw.split("T")[0]
            else:
                date_str = timestamp_raw.strftime("%Y-%m-%d") if timestamp_raw else ""
            
            # Add to pie data
            pie_data[activity_type] = pie_data.get(activity_type, 0) + emission
            
            # Add to line data
            if date_str:
                line_data[date_str] = line_data.get(date_str, 0) + emission
        
        # Sort line chart data by date
        sorted_dates = sorted(line_data.keys())
        
        return {
            "pie_chart": {
                "labels": list(pie_data.keys()),
                "data": list(pie_data.values())
            },
            "line_chart": {
                "labels": sorted_dates,
                "data": [line_data[d] for d in sorted_dates]
            }
        }
        
    except Exception as e:
        logger.error(f"Error getting dashboard stats: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@app.get("/api/dashboard/logs")
async def get_dashboard_logs_endpoint(current_user: TokenData = Depends(get_current_active_user)):
    """Mendapatkan audit logs untuk dashboard (Cassandra)."""
    user_id = current_user.user_id
    logger.info(f"Dashboard logs request for user: {user_id}")
    
    try:
        # Get audit logs from Cassandra service
        all_logs = get_audit_logs(user_id=user_id, limit=100)
        
        # Format logs for frontend
        logs = []
        for log in all_logs:
            logs.append({
                "user": current_user.email,  # Gunakan email dari token
                "action": log.get("action_type", "UNKNOWN"),
                "time": log.get("activity_time"),
                "status": "Success"
            })
        
        # Sort by time (newest first)
        logs.sort(key=lambda x: x['time'] if x['time'] else "", reverse=True)
        
        logger.info(f"Found {len(logs)} audit logs for user {user_id}")
        return {"logs": logs[:10]}  # Return last 10 logs
        
    except Exception as e:
        logger.error(f"Error getting audit logs: {e}", exc_info=True)
        return {"logs": []}  # Return empty array on error instead of raising

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

