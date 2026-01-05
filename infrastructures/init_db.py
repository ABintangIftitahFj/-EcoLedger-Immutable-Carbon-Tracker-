import os
import time
import datetime
import bcrypt
from pymongo import MongoClient, ASCENDING, DESCENDING

print("⏳ Menunggu database siap...")

# Determine MongoDB URI: prefer env var, otherwise use Compose service hostname
mongo_uri = os.environ.get("MONGODB_URI", "mongodb://mongodb:27017/")

# Create client with short server selection timeout and wait until ready
client = MongoClient(mongo_uri, serverSelectionTimeoutMS=5000)
db = client["eco_ledger_db"]

for attempt in range(1, 13):
    try:
        client.admin.command('ping')
        print(f"✅ MongoDB reachable (attempt {attempt})")
        break
    except Exception:
        wait = 2
        print(f"MongoDB not ready, retrying in {wait}s... (attempt {attempt})")
        time.sleep(wait)
else:
    print("❌ MongoDB tidak tersedia setelah beberapa percobaan, hentikan init.")
    raise SystemExit(1)

# Password Hashing Functions
def get_password_hash(password: str) -> str:
    """Hash password menggunakan bcrypt."""
    password_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')

def create_admin_user():
    """Create default admin user if not exists."""
    admin_email = "admin@ecoledger.com"
    admin_password = "admin123"
    
    # Cek apakah admin sudah ada
    if db.users.find_one({"email": admin_email}):
        print(f"ℹ️  Admin user '{admin_email}' sudah ada.")
        return
    
    # Buat admin baru
    new_admin = {
        "email": admin_email,
        "password": get_password_hash(admin_password),
        "name": "Administrator",
        "role": "admin",
        "created_at": datetime.datetime.utcnow().isoformat()
    }
    
    db.users.insert_one(new_admin)
    print(f"✅ Admin user '{admin_email}' berhasil dibuat!")
    print(f"🔑 Email: {admin_email}")
    print(f"🔑 Password: {admin_password}")

try:
    print("🚀 Setup MongoDB...")

    # Create Users Collection with Validation
    if "users" not in db.list_collection_names():
        db.create_collection("users", validator={
            "$jsonSchema": {
                "bsonType": "object",
                "required": ["email", "password", "name", "role", "created_at"],
                "properties": {
                    "email": {"bsonType": "string"},
                    "password": {"bsonType": "string"},
                    "name": {"bsonType": "string"},
                    "role": {"enum": ["user", "admin"]},
                    "created_at": {"bsonType": "string"}
                }
            }
        })
        db.users.create_index([("email", ASCENDING)], unique=True)
        print("✅ MongoDB: Collection 'users' created.")

    # Create Activity Logs
    if "activity_logs" not in db.list_collection_names():
        db.create_collection("activity_logs")
        db.activity_logs.create_index([("user_id", ASCENDING), ("timestamp", DESCENDING)])
        db.activity_logs.create_index([("current_hash", ASCENDING)])
        print("✅ MongoDB: Collection 'activity_logs' created.")

    # Create default admin user
    create_admin_user()

except Exception as e:
    print(f"❌ Error MongoDB: {e}")

print("\n✨ Setup MongoDB Selesai! Untuk Cassandra, jalankan perintah docker exec.")