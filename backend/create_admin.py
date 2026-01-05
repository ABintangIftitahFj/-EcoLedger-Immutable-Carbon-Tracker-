# backend/create_admin.py
from pymongo import MongoClient
import bcrypt
import os
import datetime

# 1. Koneksi ke Database (Pakai alamat internal Docker)
MONGO_URL = os.getenv("MONGO_URL", "mongodb://mongodb:27017")
client = MongoClient(MONGO_URL)
db = client.eco_ledger_db

# 2. Setup Password Hasher (Sama seperti di auth.py)
def get_password_hash(password: str) -> str:
    """Hash password menggunakan bcrypt."""
    password_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')

def create_admin():
    # Data Admin
    admin_email = "admin@ecoledger.com"
    admin_password = "admin123"
    
    # Cek dulu apakah admin sudah ada?
    if db.users.find_one({"email": admin_email}):
        print(f"❌ Gagal: User {admin_email} sudah ada di database!")
        return

    # Buat Object User Baru
    new_admin = {
        "email": admin_email,
        "password": get_password_hash(admin_password), # <--- INI KUNCINYA (Di-hash)
        "name": "Administrator",
        "role": "admin", # Field khusus untuk membedakan admin
        "created_at": datetime.datetime.utcnow().isoformat()
    }

    # Simpan ke MongoDB
    db.users.insert_one(new_admin)
    print(f"✅ SUKSES: Admin user '{admin_email}' berhasil dibuat!")
    print(f"🔑 Password: {admin_password}")

if __name__ == "__main__":
    create_admin()