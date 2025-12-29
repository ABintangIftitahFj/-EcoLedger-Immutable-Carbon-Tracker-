"""
=============================================================================
HASHING.PY - Sistem Hash Chain untuk Integritas Data (Blockchain-like)
=============================================================================

File ini mengimplementasikan mekanisme hash chain yang mirip dengan
blockchain untuk menjamin integritas data aktivitas karbon.

Konsep Hash Chain:
------------------
Setiap record aktivitas memiliki hash yang dihitung dari:
1. Hash record sebelumnya (previous_hash)
2. Data aktivitas (user_id, activity_type, emission, timestamp)

Dengan cara ini, jika satu record diubah, SEMUA hash setelahnya akan
menjadi invalid. Ini membuat data menjadi "tamper-evident" - mudah
mendeteksi jika ada manipulasi data.

Ilustrasi:
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Record 1   │    │  Record 2   │    │  Record 3   │
│  hash: A    │───▶│  prev: A    │───▶│  prev: B    │
│             │    │  hash: B    │    │  hash: C    │
└─────────────┘    └─────────────┘    └─────────────┘

Jika Record 2 diubah, hash B berubah, maka Record 3 tidak valid
karena prev_hash-nya tidak cocok dengan hash baru B.

Algoritma: SHA-256 (Secure Hash Algorithm 256-bit)
- Output selalu 64 karakter hexadecimal (256 bit)
- Collision-resistant: sangat sulit menemukan 2 input dengan hash sama
- Satu perubahan kecil = hash berubah total (avalanche effect)

Author: EcoLedger Team
Version: 1.0.0
=============================================================================
"""

import hashlib
from typing import Union, Dict, Any
from motor.motor_asyncio import AsyncIOMotorDatabase


def generate_hash(
    previous_hash: str,
    user_id: str,
    activity_type: str,
    carbon_emission: Union[float, int],
    timestamp: str
) -> str:
    """
    Membuat hash SHA-256 untuk satu record aktivitas.
    
    Hash dibuat dengan menggabungkan (concatenate) semua data aktivitas
    menjadi satu string, lalu di-hash. Urutan penggabungan HARUS konsisten
    agar verifikasi bisa berfungsi dengan benar.
    
    Format payload:
        "{previous_hash}{user_id}{activity_type}{emission}{timestamp}"
    
    Args:
        previous_hash: Hash dari record sebelumnya dalam chain.
                      Gunakan 64 karakter "0" untuk record pertama (genesis).
        user_id: ID pengguna yang membuat aktivitas
        activity_type: Jenis aktivitas (contoh: "car", "motorbike")
        carbon_emission: Jumlah emisi dalam kg CO2e (bisa float atau int)
        timestamp: Waktu pencatatan dalam format ISO string
    
    Returns:
        str: Hash SHA-256 dalam format hexadecimal (64 karakter)
    
    Example:
        >>> generate_hash("0"*64, "user123", "car", 4.87, "2024-12-29T10:00:00")
        "a3f5b2c8d1e9f4a7b6c5d8e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1"
    
    Notes:
        - Fungsi ini HARUS deterministic (input sama = output sama)
        - Urutan concatenation TIDAK BOLEH diubah
        - Perubahan implementasi akan membuat semua hash lama invalid
    """
    # Konversi emission ke string untuk konsistensi
    # float("4.87") dan "4.87" harus menghasilkan hash yang sama
    emission_str = str(carbon_emission)
    
    # Gabungkan semua data menjadi satu string payload
    # PENTING: Urutan ini TIDAK BOLEH diubah!
    payload = f"{previous_hash}{user_id}{activity_type}{emission_str}{timestamp}"
    
    # Hash dengan SHA-256 dan kembalikan dalam format hexadecimal
    # encode('utf-8') diperlukan karena hashlib butuh bytes, bukan string
    hash_result = hashlib.sha256(payload.encode('utf-8')).hexdigest()
    
    return hash_result


def verify_hash(
    record: Dict[str, Any]
) -> bool:
    """
    Memverifikasi apakah hash satu record masih valid.
    
    Fungsi ini menghitung ulang hash dari data record,
    lalu membandingkan dengan current_hash yang tersimpan.
    Jika berbeda, berarti data sudah dimodifikasi.
    
    Args:
        record: Dictionary record aktivitas dengan field:
               - previous_hash: Hash record sebelumnya
               - user_id: ID pengguna
               - activity_type: Jenis aktivitas
               - emission: Jumlah emisi
               - timestamp: Waktu pencatatan
               - current_hash: Hash yang tersimpan (untuk diverifikasi)
    
    Returns:
        bool: True jika hash valid (data tidak diubah),
              False jika hash tidak cocok (data sudah dimanipulasi)
    
    Example:
        >>> record = db.activity_logs.find_one({"_id": some_id})
        >>> if verify_hash(record):
        >>>     print("Data valid, tidak ada manipulasi")
        >>> else:
        >>>     print("PERINGATAN: Data kemungkinan sudah diubah!")
    """
    # Hitung ulang hash dari data yang ada di record
    calculated_hash = generate_hash(
        previous_hash=record["previous_hash"],
        user_id=record["user_id"],
        activity_type=record["activity_type"],
        carbon_emission=record["emission"],
        timestamp=record["timestamp"]
    )
    
    # Bandingkan dengan hash yang tersimpan
    # Menggunakan == langsung karena keduanya lowercase hexadecimal
    return calculated_hash == record["current_hash"]


async def verify_chain(db: AsyncIOMotorDatabase) -> Dict[str, Any]:
    """
    Memverifikasi integritas seluruh hash chain di database.
    
    Fungsi ini mengecek DUA hal untuk setiap record:
    1. Hash record valid (data tidak diubah)
    2. previous_hash cocok dengan current_hash record sebelumnya
    
    Ini memastikan tidak ada record yang diubah, dihapus, atau
    disisipkan di tengah chain.
    
    Args:
        db: Instance AsyncIOMotorDatabase untuk query MongoDB
    
    Returns:
        Dict dengan struktur:
        {
            "valid": bool,           # True jika semua hash valid
            "total_records": int,    # Jumlah record yang dicek
            "message": str,          # Pesan hasil verifikasi
            "invalid_record_id": str # ID record yang rusak (jika ada)
        }
    
    Example:
        >>> from database import get_db
        >>> db = await get_db()
        >>> result = await verify_chain(db)
        >>> if result["valid"]:
        >>>     print("Semua data valid!")
        >>> else:
        >>>     print(f"ERROR di record: {result['invalid_record_id']}")
    
    Performance Note:
        - Fungsi ini membaca SEMUA record dari database
        - Untuk database besar, pertimbangkan pagination atau sampling
        - Jalankan di off-peak hours untuk database production
    """
    # Ambil collection activity_logs
    collection = db["activity_logs"]
    
    # Hitung total record untuk response
    total_records = await collection.count_documents({})
    
    # Jika database kosong, langsung return valid
    if total_records == 0:
        return {
            "valid": True,
            "total_records": 0,
            "message": "Database kosong, tidak ada record untuk diverifikasi."
        }
    
    # =========================================================================
    # Ambil semua record, diurutkan dari yang terlama
    # =========================================================================
    # Sorting by _id karena MongoDB ObjectId terurut berdasarkan waktu insert
    cursor = collection.find().sort("_id", 1)  # 1 = ascending (oldest first)
    
    # Variabel untuk tracking chain
    previous_hash = "0" * 64  # Genesis: 64 karakter nol
    record_number = 0
    
    # =========================================================================
    # Iterasi dan verifikasi setiap record
    # =========================================================================
    async for record in cursor:
        record_number += 1
        
        # -----------------------------------------------------------------
        # CHECK 1: Apakah previous_hash cocok dengan chain?
        # -----------------------------------------------------------------
        # Record harus point ke hash record sebelumnya
        if record["previous_hash"] != previous_hash:
            return {
                "valid": False,
                "total_records": total_records,
                "message": f"Chain terputus di record #{record_number}. "
                          f"Previous hash tidak cocok.",
                "invalid_record_id": str(record["_id"])
            }
        
        # -----------------------------------------------------------------
        # CHECK 2: Apakah hash record ini valid?
        # -----------------------------------------------------------------
        # Recalculate hash dan bandingkan dengan yang tersimpan
        if not verify_hash(record):
            return {
                "valid": False,
                "total_records": total_records,
                "message": f"Hash tidak valid di record #{record_number}. "
                          f"Data kemungkinan sudah dimodifikasi.",
                "invalid_record_id": str(record["_id"])
            }
        
        # Update previous_hash untuk record berikutnya
        previous_hash = record["current_hash"]
    
    # =========================================================================
    # Semua record valid!
    # =========================================================================
    return {
        "valid": True,
        "total_records": total_records,
        "message": f"Semua {total_records} record valid. Integritas data terjamin!"
    }


# =============================================================================
# UTILITY FUNCTIONS
# =============================================================================

def get_genesis_hash() -> str:
    """
    Mendapatkan hash genesis (hash pertama dalam chain).
    
    Genesis hash adalah "0" sebanyak 64 karakter, menandakan
    bahwa record ini adalah yang pertama dalam chain.
    
    Returns:
        str: String 64 karakter "0"
    """
    return "0" * 64


def is_genesis_hash(hash_value: str) -> bool:
    """
    Mengecek apakah hash adalah genesis hash.
    
    Args:
        hash_value: Hash yang ingin dicek
    
    Returns:
        bool: True jika ini adalah genesis hash (semua nol)
    """
    return hash_value == "0" * 64
