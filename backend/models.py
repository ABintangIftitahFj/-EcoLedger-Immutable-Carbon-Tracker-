"""
=============================================================================
MODELS.PY - Definisi Model Data untuk EcoLedger API
=============================================================================

File ini berisi semua Pydantic model yang digunakan untuk:
1. Validasi request dari client (input validation)
2. Format response ke client (output serialization)
3. Dokumentasi API otomatis di Swagger UI

Pydantic dipilih karena:
- Validasi data otomatis dengan type hints
- Serialization/deserialization JSON yang efisien
- Auto-generate JSON Schema untuk OpenAPI docs
- Error message yang informatif untuk debugging

Author: EcoLedger Team
Version: 1.0.0
=============================================================================
"""

from pydantic import BaseModel, Field, validator
from typing import Optional, Dict, Any, List
from datetime import datetime


# =============================================================================
# MODEL REQUEST: Untuk Menerima Data dari Client
# =============================================================================

class ActivityCreate(BaseModel):
    """
    Model untuk membuat aktivitas karbon baru.
    
    Digunakan pada endpoint POST /api/activities untuk menerima
    data aktivitas dari user. Semua field di-validasi secara otomatis.
    
    Attributes:
        user_id: ID unik pengguna (wajib diisi)
        activity_type: Jenis aktivitas sesuai mapping Climatiq (wajib)
        distance_km: Jarak tempuh dalam kilometer (untuk transportasi)
        energy_kwh: Konsumsi energi dalam kWh (untuk listrik)
        weight_kg: Berat dalam kg (untuk limbah)
        money_spent: Uang yang dikeluarkan (untuk kalkulasi berbasis biaya)
        description: Deskripsi opsional aktivitas
    
    Example:
        {
            "user_id": "user123",
            "activity_type": "car",
            "distance_km": 25.5,
            "description": "Perjalanan ke kantor"
        }
    """
    
    # === FIELD WAJIB ===
    user_id: str = Field(
        ...,  # "..." artinya field ini WAJIB diisi
        description="ID unik pengguna yang mencatat aktivitas"
    )
    
    activity_type: str = Field(
        ...,
        description="Jenis aktivitas (contoh: 'car', 'motorbike', 'bus')"
    )
    
    # === FIELD OPSIONAL - Parameter Aktivitas ===
    # Hanya satu yang perlu diisi, tergantung jenis aktivitas
    
    distance_km: Optional[float] = Field(
        None,  # None = opsional
        description="Jarak tempuh dalam kilometer (untuk aktivitas transportasi)"
    )
    
    energy_kwh: Optional[float] = Field(
        None,
        description="Konsumsi energi dalam kilowatt-hour (untuk aktivitas listrik)"
    )
    
    weight_kg: Optional[float] = Field(
        None,
        description="Berat dalam kilogram (untuk aktivitas limbah/sampah)"
    )
    
    money_spent: Optional[float] = Field(
        None,
        description="Jumlah uang yang dikeluarkan dalam USD (untuk kalkulasi berbasis biaya)"
    )
    
    description: Optional[str] = Field(
        None,
        description="Deskripsi atau catatan tambahan untuk aktivitas ini"
    )
    
    @validator('activity_type')
    def validasi_activity_type(cls, v):
        """
        Validasi custom untuk memastikan activity_type tidak kosong.
        
        Validator ini dijalankan otomatis oleh Pydantic sebelum
        data disimpan ke model. Jika validasi gagal, akan raise
        ValueError yang dikembalikan sebagai HTTP 422.
        
        Args:
            v: Nilai activity_type yang dikirim client
            
        Returns:
            str: Nilai yang sudah di-normalize (lowercase, trim whitespace)
            
        Raises:
            ValueError: Jika activity_type kosong atau hanya whitespace
        """
        if not v or not v.strip():
            raise ValueError('activity_type tidak boleh kosong')
        
        # Normalize: lowercase dan hapus whitespace di awal/akhir
        return v.strip().lower()
    
    class Config:
        """Konfigurasi Pydantic untuk model ini."""
        
        # Contoh data untuk Swagger UI documentation
        json_schema_extra = {
            "example": {
                "user_id": "user123",
                "activity_type": "car",
                "distance_km": 25.5,
                "description": "Perjalanan ke kantor"
            }
        }


class EmissionEstimateRequest(BaseModel):
    """
    Model untuk menghitung estimasi emisi tanpa menyimpan ke database.
    
    Berguna untuk preview emisi sebelum user mengkonfirmasi aktivitas.
    Endpoint: POST /api/estimate
    
    Attributes:
        activity_type: Jenis aktivitas untuk kalkulasi
        distance_km: Jarak (opsional, untuk transportasi)
        energy_kwh: Energi (opsional, untuk listrik)
        weight_kg: Berat (opsional, untuk limbah)
        money_spent: Biaya (opsional)
    """
    
    activity_type: str = Field(..., description="Jenis aktivitas")
    distance_km: Optional[float] = None
    energy_kwh: Optional[float] = None
    weight_kg: Optional[float] = None
    money_spent: Optional[float] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "activity_type": "motorbike",
                "distance_km": 10.0
            }
        }


# =============================================================================
# MODEL RESPONSE: Untuk Mengirim Data ke Client
# =============================================================================

class ClimatiqData(BaseModel):
    """
    Data hasil perhitungan dari Climatiq API.
    
    Model ini menyimpan respons mentah dari Climatiq untuk keperluan
    audit dan transparansi. User bisa melihat emission factor mana
    yang digunakan untuk kalkulasi.
    
    Attributes:
        co2e: Total emisi karbon dalam kg CO2 equivalent
        co2e_unit: Satuan emisi (biasanya 'kg')
        activity_id: ID aktivitas yang digunakan di Climatiq
        emission_factor: Detail emission factor (sumber data, tahun, dll)
    """
    
    co2e: float = Field(..., description="Total emisi CO2 equivalent dalam kg")
    co2e_unit: str = Field(..., description="Satuan emisi (biasanya 'kg')")
    activity_id: str = Field(..., description="ID aktivitas dari database Climatiq")
    emission_factor: Optional[Dict[str, Any]] = Field(
        None,
        description="Detail emission factor: sumber, tahun, region, dll"
    )


class ActivityResponse(BaseModel):
    """
    Model respons untuk data aktivitas yang tersimpan.
    
    Dikembalikan setelah aktivitas berhasil dibuat atau ketika
    mengambil data aktivitas dari database. Mencakup hash untuk
    verifikasi integritas data (blockchain-like).
    
    Attributes:
        id: MongoDB ObjectId sebagai string
        user_id: ID pengguna pemilik aktivitas
        activity_type: Jenis aktivitas yang dilakukan
        emission: Total emisi karbon dalam kg CO2e
        emission_unit: Satuan emisi
        timestamp: Waktu pencatatan dalam format ISO
        previous_hash: Hash dari record sebelumnya (membentuk chain)
        current_hash: Hash unik untuk record ini
        description: Deskripsi aktivitas (jika ada)
        climatiq_data: Data mentah dari Climatiq API
        distance_km/energy_kwh/weight_kg/money_spent: Parameter aktivitas
    """
    
    # === IDENTIFIKASI ===
    id: str = Field(..., description="ID aktivitas (MongoDB ObjectId)")
    user_id: str = Field(..., description="ID pengguna pemilik aktivitas")
    activity_type: str = Field(..., description="Jenis aktivitas")
    
    # === DATA EMISI ===
    emission: float = Field(..., description="Total emisi dalam kg CO2e")
    emission_unit: str = Field(default="kg CO2e", description="Satuan emisi")
    
    # === TIMESTAMP & HASH CHAIN ===
    timestamp: str = Field(..., description="Waktu pencatatan (ISO format)")
    previous_hash: str = Field(..., description="Hash record sebelumnya (blockchain link)")
    current_hash: str = Field(..., description="Hash unik record ini (untuk verifikasi)")
    
    # === DATA OPSIONAL ===
    description: Optional[str] = None
    climatiq_data: Optional[ClimatiqData] = None
    
    # === PARAMETER AKTIVITAS ===
    distance_km: Optional[float] = None
    energy_kwh: Optional[float] = None
    weight_kg: Optional[float] = None
    money_spent: Optional[float] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "id": "507f1f77bcf86cd799439011",
                "user_id": "user123",
                "activity_type": "car",
                "emission": 4.87,
                "emission_unit": "kg CO2e",
                "timestamp": "2024-12-29T09:00:00.123456",
                "previous_hash": "0000000000000000000000000000000000000000000000000000000000000000",
                "current_hash": "a3f5b2c8d1e9f4a7b6c5d8e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1",
                "distance_km": 25.5,
                "description": "Perjalanan ke kantor"
            }
        }


class EmissionEstimateResponse(BaseModel):
    """
    Model respons untuk estimasi emisi (tanpa disimpan).
    
    Dikembalikan oleh endpoint POST /api/estimate untuk preview
    perhitungan emisi sebelum user memutuskan untuk menyimpan.
    """
    
    activity_type: str = Field(..., description="Jenis aktivitas yang dihitung")
    emission: float = Field(..., description="Estimasi emisi dalam kg CO2e")
    emission_unit: str = Field(default="kg CO2e", description="Satuan emisi")
    climatiq_activity_id: str = Field(..., description="ID aktivitas Climatiq yang digunakan")
    parameters: Dict[str, Any] = Field(..., description="Parameter yang digunakan dalam kalkulasi")


class ActivityListResponse(BaseModel):
    """
    Model respons untuk daftar aktivitas dengan pagination.
    
    Digunakan pada endpoint GET /api/activities yang mengembalikan
    banyak aktivitas sekaligus dengan informasi halaman.
    
    Attributes:
        total: Jumlah total aktivitas yang cocok dengan filter
        page: Nomor halaman saat ini
        page_size: Jumlah item per halaman
        activities: Daftar aktivitas di halaman ini
    """
    
    total: int = Field(..., description="Total aktivitas yang ditemukan")
    page: int = Field(..., description="Nomor halaman saat ini")
    page_size: int = Field(..., description="Jumlah item per halaman")
    activities: List[ActivityResponse] = Field(..., description="Daftar aktivitas")


# =============================================================================
# MODEL SISTEM: Untuk Health Check dan Verifikasi
# =============================================================================

class HealthResponse(BaseModel):
    """
    Model respons untuk health check endpoint.
    
    Menampilkan status kesehatan sistem termasuk koneksi database
    dan konfigurasi API eksternal.
    
    Attributes:
        status: Status keseluruhan ('healthy' atau 'unhealthy')
        timestamp: Waktu pengecekan
        database: Status koneksi MongoDB
        climatiq_api: Status konfigurasi Climatiq API
    """
    
    status: str = Field(default="healthy", description="Status sistem")
    timestamp: str = Field(..., description="Waktu health check")
    database: str = Field(default="connected", description="Status MongoDB")
    climatiq_api: str = Field(default="configured", description="Status Climatiq API")


class HashVerificationResponse(BaseModel):
    """
    Model respons untuk verifikasi integritas hash chain.
    
    Digunakan endpoint GET /api/verify-chain untuk memastikan
    tidak ada data yang dimanipulasi (blockchain-like verification).
    
    Attributes:
        valid: True jika semua hash valid, False jika ada yang rusak
        total_records: Jumlah record yang diverifikasi
        message: Pesan hasil verifikasi
        invalid_record_id: ID record yang rusak (jika ada)
    """
    
    valid: bool = Field(..., description="Apakah semua hash valid?")
    total_records: int = Field(..., description="Jumlah record yang diverifikasi")
    message: str = Field(..., description="Pesan hasil verifikasi")
    invalid_record_id: Optional[str] = Field(None, description="ID record yang hash-nya tidak cocok")
    
    class Config:
        json_schema_extra = {
            "example": {
                "valid": True,
                "total_records": 150,
                "message": "Semua hash valid. Integritas data terjamin!"
            }
        }


class ErrorResponse(BaseModel):
    """
    Model respons untuk error standar.
    
    Format ini digunakan untuk semua error response agar konsisten
    dan mudah di-handle oleh frontend.
    
    Attributes:
        error: Pesan error singkat
        detail: Detail tambahan (opsional)
        timestamp: Waktu terjadinya error
    """
    
    error: str = Field(..., description="Pesan error singkat")
    detail: Optional[str] = Field(None, description="Detail tambahan tentang error")
    timestamp: str = Field(..., description="Waktu terjadinya error")
