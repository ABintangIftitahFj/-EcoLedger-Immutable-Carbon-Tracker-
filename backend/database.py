"""
=============================================================================
DATABASE.PY - Koneksi Database MongoDB Asinkron
=============================================================================

File ini mengelola koneksi ke MongoDB menggunakan Motor (async driver).
Motor adalah wrapper asinkron untuk PyMongo yang memungkinkan operasi
database non-blocking, cocok untuk FastAPI yang berbasis async/await.

Kenapa Motor, bukan PyMongo langsung?
1. Non-blocking I/O: Tidak memblock event loop saat query database
2. Concurrent requests: Bisa handle banyak request bersamaan
3. Performa lebih baik: Optimal untuk high-traffic API

Lifecycle Koneksi:
1. Aplikasi start → connect() dipanggil → koneksi dibuat
2. Aplikasi berjalan → get_database() untuk akses database
3. Aplikasi shutdown → disconnect() dipanggil → koneksi ditutup bersih

Author: EcoLedger Team
Version: 1.0.0
=============================================================================
"""

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from config import settings
import logging

# Setup logger untuk modul ini
logger = logging.getLogger(__name__)


class Database:
    """
    Manager koneksi MongoDB menggunakan pattern Singleton.
    
    Class ini menggunakan class variable (bukan instance variable)
    untuk menyimpan koneksi, sehingga hanya ada satu koneksi
    yang di-share ke seluruh aplikasi (connection pooling).
    
    Penggunaan:
        # Di startup aplikasi
        await Database.connect()
        
        # Di endpoint
        db = Database.get_database()
        result = await db.collection.find_one({...})
        
        # Di shutdown aplikasi
        await Database.disconnect()
    
    Attributes:
        client: Instance AsyncIOMotorClient (connection pool)
        database: Instance AsyncIOMotorDatabase (database spesifik)
    """
    
    # Class variables - di-share ke semua instance
    client: AsyncIOMotorClient = None
    database: AsyncIOMotorDatabase = None
    
    @classmethod
    async def connect(cls):
        """
        Membuat koneksi ke MongoDB.
        
        Method ini dipanggil saat aplikasi FastAPI startup.
        Jika koneksi gagal, akan raise exception dan mencegah
        aplikasi dari running dengan database yang tidak tersedia.
        
        Raises:
            Exception: Jika koneksi ke MongoDB gagal
        
        Side Effects:
            - cls.client diisi dengan AsyncIOMotorClient
            - cls.database diisi dengan database instance
            - Log info/error ditulis ke logger
        """
        try:
            # Log proses koneksi untuk monitoring
            logger.info(f"Menghubungkan ke MongoDB di {settings.mongodb_uri}")
            
            # Buat client dengan connection string dari config
            # Motor otomatis mengelola connection pool
            cls.client = AsyncIOMotorClient(settings.mongodb_uri)
            
            # Pilih database yang akan digunakan
            cls.database = cls.client[settings.mongodb_database]
            
            # Test koneksi dengan ping command
            # Ini memastikan MongoDB benar-benar tersedia
            await cls.client.admin.command('ping')
            
            logger.info("Berhasil terhubung ke MongoDB")
            
        except Exception as e:
            # Log error untuk debugging
            logger.error(f"Gagal terhubung ke MongoDB: {e}")
            # Re-raise exception agar aplikasi tidak start dengan DB bermasalah
            raise
    
    @classmethod
    async def disconnect(cls):
        """
        Menutup koneksi ke MongoDB dengan bersih.
        
        Method ini dipanggil saat aplikasi FastAPI shutdown.
        Penting untuk menutup koneksi agar tidak ada resource leak.
        
        Side Effects:
            - Koneksi MongoDB ditutup
            - cls.client tetap ada (tidak di-None-kan)
            - Log informasi shutdown
        """
        if cls.client:
            logger.info("Memutus koneksi dari MongoDB")
            cls.client.close()
            logger.info("Koneksi MongoDB berhasil diputus")
    
    @classmethod
    def get_database(cls) -> AsyncIOMotorDatabase:
        """
        Mendapatkan instance database untuk operasi query.
        
        Method ini digunakan oleh endpoint untuk mengakses database.
        Pastikan connect() sudah dipanggil sebelum memanggil ini.
        
        Returns:
            AsyncIOMotorDatabase: Database instance yang siap digunakan
            
        Raises:
            RuntimeError: Jika database belum diinisialisasi
            
        Example:
            db = Database.get_database()
            users = await db.users.find({}).to_list(100)
        """
        if cls.database is None:
            raise RuntimeError(
                "Database belum diinisialisasi. "
                "Pastikan connect() dipanggil saat startup aplikasi."
            )
        return cls.database
    
    @classmethod
    async def get_collection(cls, collection_name: str):
        """
        Mendapatkan collection tertentu dari database.
        
        Shortcut untuk mengakses collection tanpa perlu memanggil
        get_database() terlebih dahulu.
        
        Args:
            collection_name: Nama collection yang ingin diakses
            
        Returns:
            Collection: MongoDB collection yang siap digunakan
            
        Example:
            users_collection = await Database.get_collection("users")
            user = await users_collection.find_one({"_id": user_id})
        """
        db = cls.get_database()
        return db[collection_name]


# =============================================================================
# HELPER FUNCTIONS - Dependency Injection untuk FastAPI
# =============================================================================
# Fungsi-fungsi ini bisa digunakan sebagai dependency di endpoint FastAPI

async def get_db() -> AsyncIOMotorDatabase:
    """
    Dependency untuk mendapatkan instance database.
    
    Digunakan dengan FastAPI Depends untuk inject database
    ke dalam endpoint handler.
    
    Returns:
        AsyncIOMotorDatabase: Database instance
        
    Example:
        @app.get("/users")
        async def get_users(db: AsyncIOMotorDatabase = Depends(get_db)):
            return await db.users.find({}).to_list(100)
    """
    return Database.get_database()


async def get_activity_logs_collection():
    """
    Mendapatkan collection 'activity_logs'.
    
    Collection ini menyimpan semua aktivitas karbon user
    beserta hash chain untuk verifikasi integritas.
    
    Returns:
        Collection: Collection activity_logs
    """
    return await Database.get_collection("activity_logs")


async def get_users_collection():
    """
    Mendapatkan collection 'users'.
    
    Collection ini menyimpan data pengguna termasuk
    profil, preferensi, dan autentikasi.
    
    Returns:
        Collection: Collection users
    """
    return await Database.get_collection("users")
