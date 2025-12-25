import time
from pymongo import MongoClient, ASCENDING, DESCENDING

print("⏳ Menunggu database siap (10 detik)...")
time.sleep(10) 

# --- SETUP MONGODB ---
try:
    print("🚀 Setup MongoDB...")
    client = MongoClient("mongodb://localhost:27017/")
    db = client["eco_ledger_db"]
    
    # Create Users Collection with Validation
    if "users" not in db.list_collection_names():
        db.create_collection("users", validator={
            "$jsonSchema": {
                "bsonType": "object",
                "required": ["username", "email", "role"],
                "properties": {
                    "username": {"bsonType": "string"},
                    "email": {"bsonType": "string"},
                    "role": {"enum": ["user", "admin"]}
                }
            }
        })
        db.users.create_index([("username", ASCENDING)], unique=True)
        db.users.create_index([("email", ASCENDING)], unique=True)
        print("✅ MongoDB: Collection 'users' created.")

    # Create Activity Logs
    if "activity_logs" not in db.list_collection_names():
        db.create_collection("activity_logs")
        db.activity_logs.create_index([("user_id", ASCENDING), ("timestamp", DESCENDING)])
        db.activity_logs.create_index([("current_hash", ASCENDING)])
        print("✅ MongoDB: Collection 'activity_logs' created.")
        
except Exception as e:
    print(f"❌ Error MongoDB: {e}")

print("\n✨ Setup MongoDB Selesai! Untuk Cassandra, jalankan perintah docker exec.")