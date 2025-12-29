"""
=============================================================================
CONFIG.PY - Konfigurasi Aplikasi EcoLedger
=============================================================================

File ini mengelola semua konfigurasi aplikasi menggunakan Pydantic Settings.
Konfigurasi dibaca dari environment variables atau file .env secara otomatis.

Keuntungan menggunakan Pydantic Settings:
1. Type-safe: Semua config memiliki tipe data yang jelas
2. Validasi otomatis: Error jika config wajib tidak ada
3. Environment-based: Mudah deploy ke berbagai environment
4. Auto-complete IDE: Developer experience yang baik

Cara Penggunaan:
    from config import settings
    print(settings.climatiq_api_key)

Author: EcoLedger Team
Version: 1.0.0
=============================================================================
"""

from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List


class Settings(BaseSettings):
    """
    Konfigurasi aplikasi yang dimuat dari environment variables.
    
    Semua nilai dibaca dari file .env di parent directory atau
    langsung dari system environment variables. Nilai dengan default
    tidak wajib diisi di .env, sedangkan yang tanpa default wajib ada.
    
    Hierarki prioritas:
    1. System environment variable (tertinggi)
    2. File .env
    3. Default value di class ini (terendah)
    
    Attributes:
        climatiq_api_key: API key untuk Climatiq (WAJIB)
        climatiq_api_url: Base URL Climatiq API
        mongodb_uri: Connection string MongoDB
        mongodb_database: Nama database MongoDB
        secret_key: Secret key untuk JWT dan enkripsi (WAJIB)
        ... (lihat field lainnya di bawah)
    """
    
    # =========================================================================
    # CLIMATIQ API CONFIGURATION
    # =========================================================================
    # API key didapat dari: https://www.climatiq.io/
    # Field ini WAJIB, aplikasi tidak akan start tanpa ini
    
    climatiq_api_key: str  # Tanpa default = WAJIB
    climatiq_api_url: str = "https://api.climatiq.io/data/v1"  # Base URL API
    
    # =========================================================================
    # MONGODB DATABASE CONFIGURATION
    # =========================================================================
    # MongoDB digunakan sebagai database utama untuk menyimpan aktivitas
    # Pastikan Docker container 'eco_mongo' sudah running
    
    mongodb_uri: str = "mongodb://localhost:27017/"  # Connection string
    mongodb_database: str = "eco_ledger_db"  # Nama database
    
    # =========================================================================
    # CASSANDRA DATABASE CONFIGURATION (Untuk Audit Log)
    # =========================================================================
    # Cassandra digunakan untuk audit trail (belum diimplementasikan)
    # Konfigurasi ini disiapkan untuk pengembangan selanjutnya
    
    cassandra_host: str = "localhost"
    cassandra_port: int = 9042
    cassandra_keyspace: str = "eco_logs"
    
    # =========================================================================
    # APPLICATION SETTINGS
    # =========================================================================
    # Pengaturan umum aplikasi FastAPI
    
    app_env: str = "development"  # development | staging | production
    app_port: int = 8000  # Port untuk uvicorn
    app_host: str = "0.0.0.0"  # Host (0.0.0.0 = semua interface)
    
    # =========================================================================
    # SECURITY SETTINGS
    # =========================================================================
    # Secret key untuk signing JWT token dan enkripsi data sensitif
    # PENTING: Ganti dengan nilai random yang kuat di production!
    
    secret_key: str  # Tanpa default = WAJIB
    jwt_secret: str = ""  # Opsional, untuk autentikasi (future)
    jwt_expiration_hours: int = 24  # Masa berlaku token dalam jam
    
    # =========================================================================
    # CORS (Cross-Origin Resource Sharing) SETTINGS
    # =========================================================================
    # Daftar URL frontend yang diizinkan mengakses API ini
    # Pisahkan dengan koma untuk multiple origins
    
    allowed_origins: str = "http://localhost:3000,http://localhost:5173"
    
    # =========================================================================
    # LOGGING SETTINGS
    # =========================================================================
    # Level logging: DEBUG | INFO | WARNING | ERROR | CRITICAL
    # Development: DEBUG atau INFO
    # Production: WARNING atau ERROR
    
    log_level: str = "INFO"
    
    # =========================================================================
    # PYDANTIC SETTINGS CONFIGURATION
    # =========================================================================
    
    model_config = SettingsConfigDict(
        # Cari file .env di parent directory (karena uvicorn dijalankan dari /backend)
        env_file="../.env",
        
        # Encoding file .env
        env_file_encoding="utf-8",
        
        # Environment variable names tidak case-sensitive
        # MONGODB_URI, mongodb_uri, MongoDB_Uri semua bisa
        case_sensitive=False,
        
        # Abaikan field di .env yang tidak ada di class ini
        extra="ignore"
    )
    
    # =========================================================================
    # COMPUTED PROPERTIES
    # =========================================================================
    # Property yang dikalkulasi dari nilai config lain
    
    @property
    def cors_origins(self) -> List[str]:
        """
        Parse CORS origins dari string ke list.
        
        Environment variable menyimpan sebagai string dengan koma,
        tapi FastAPI butuh list. Property ini melakukan konversi.
        
        Returns:
            List[str]: Daftar URL yang diizinkan untuk CORS
            
        Example:
            Input: "http://localhost:3000,http://localhost:5173"
            Output: ["http://localhost:3000", "http://localhost:5173"]
        """
        return [origin.strip() for origin in self.allowed_origins.split(",")]
    
    @property
    def is_development(self) -> bool:
        """
        Cek apakah aplikasi berjalan di mode development.
        
        Berguna untuk mengaktifkan fitur debugging yang tidak
        boleh aktif di production (seperti auto-reload, detailed errors).
        
        Returns:
            bool: True jika APP_ENV adalah 'development'
        """
        return self.app_env.lower() == "development"
    
    @property
    def is_production(self) -> bool:
        """
        Cek apakah aplikasi berjalan di mode production.
        
        Di production, kita harus:
        - Nonaktifkan debug mode
        - Gunakan HTTPS
        - Set secret key yang kuat
        - Rate limiting yang ketat
        
        Returns:
            bool: True jika APP_ENV adalah 'production'
        """
        return self.app_env.lower() == "production"


# =============================================================================
# GLOBAL SETTINGS INSTANCE
# =============================================================================
# Instance tunggal yang digunakan di seluruh aplikasi.
# Import dengan: from config import settings

settings = Settings()
