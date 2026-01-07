"""
Script untuk membuat 10 user dengan organisasi berbeda dan aktivitas untuk 7 hari terakhir
Jalankan: docker exec eco_backend python /app/seed_10users_with_activities.py
"""
import sys
import os
sys.path.append('/app')

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timedelta, timezone
import bcrypt
import random
import hashlib
from bson import ObjectId
from cassandra.cluster import Cluster
from cassandra.auth import PlainTextAuthProvider
import uuid

# Timezone WIB
WIB = timezone(timedelta(hours=7))

# Cassandra connection
CASSANDRA_HOST = os.getenv("CASSANDRA_HOST", "eco_cassandra")
CASSANDRA_KEYSPACE = "eco_logs"

def get_cassandra_session():
    """Get Cassandra session"""
    cluster = Cluster([CASSANDRA_HOST])
    session = cluster.connect(CASSANDRA_KEYSPACE)
    return session, cluster

# Simple bcrypt hashing
def hash_password(password: str) -> str:
    """Hash password using bcrypt"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def generate_hash(previous_hash: str, user_id: str, activity_type: str, emission: float, timestamp: str) -> str:
    """Generate SHA-256 hash for blockchain-like chain"""
    payload = f"{previous_hash}{user_id}{activity_type}{str(emission)}{timestamp}"
    return hashlib.sha256(payload.encode('utf-8')).hexdigest()

# MongoDB connection
MONGO_URI = os.environ.get("MONGO_URI", "mongodb://eco_mongo:27017/eco_ledger_db")

# Data 10 users dengan organisasi berbeda
USERS_DATA = [
    {
        "email": "budi.santoso@greentech.com",
        "password": "budi123",
        "name": "Budi Santoso",
        "organisasi": "PT Green Technology Indonesia",
        "role": "user"
    },
    {
        "email": "siti.nurhaliza@ecoworld.com",
        "password": "siti123",
        "name": "Siti Nurhaliza",
        "organisasi": "PT Eco World Solutions",
        "role": "user"
    },
    {
        "email": "ahmad.wijaya@sustain.co.id",
        "password": "ahmad123",
        "name": "Ahmad Wijaya",
        "organisasi": "CV Sustainable Energy",
        "role": "user"
    },
    {
        "email": "rina.permata@carbonfree.id",
        "password": "rina123",
        "name": "Rina Permata",
        "organisasi": "PT Carbon Free Indonesia",
        "role": "user"
    },
    {
        "email": "dedi.kurniawan@greenlife.com",
        "password": "dedi123",
        "name": "Dedi Kurniawan",
        "organisasi": "PT Green Life Nusantara",
        "role": "user"
    },
    {
        "email": "lisa.marlina@ecofriendly.id",
        "password": "lisa123",
        "name": "Lisa Marlina",
        "organisasi": "CV Eco Friendly Solutions",
        "role": "user"
    },
    {
        "email": "rudi.hermawan@cleanair.co.id",
        "password": "rudi123",
        "name": "Rudi Hermawan",
        "organisasi": "PT Clean Air Indonesia",
        "role": "user"
    },
    {
        "email": "maya.sari@renewable.id",
        "password": "maya123",
        "name": "Maya Sari",
        "organisasi": "PT Renewable Energy ID",
        "role": "user"
    },
    {
        "email": "agus.prasetyo@zerowaste.com",
        "password": "agus123",
        "name": "Agus Prasetyo",
        "organisasi": "CV Zero Waste Indonesia",
        "role": "user"
    },
    {
        "email": "dewi.lestari@naturehub.id",
        "password": "dewi123",
        "name": "Dewi Lestari",
        "organisasi": "PT Nature Hub Indonesia",
        "role": "user"
    }
]

# Template aktivitas dengan variasi
ACTIVITY_TEMPLATES = [
    # Transportasi mobil
    {"activity_type": "car", "distance_km": [10, 15, 20, 25, 30], "descriptions": [
        "Pergi ke kantor", "Meeting klien", "Antar anak sekolah", "Belanja bulanan", "Jalan-jalan keluarga"
    ]},
    # Transportasi motor
    {"activity_type": "motorcycle", "distance_km": [5, 8, 12, 15, 20], "descriptions": [
        "Ke pasar", "Keliling kota", "Antar jemput", "Ke rumah teman", "Beli makan"
    ]},
    # Transportasi bus
    {"activity_type": "bus", "distance_km": [20, 30, 40, 50], "descriptions": [
        "Commuter ke kota", "Perjalanan kerja", "Mudik singkat", "Kunjungi keluarga"
    ]},
    # Listrik
    {"activity_type": "electricity", "kwh": [50, 75, 100, 150, 200], "descriptions": [
        "Pemakaian rumah", "Kantor bulanan", "AC dan kulkas", "Hemat energi", "Operasional toko"
    ]},
]


async def get_or_create_organisasi(db, nama_organisasi: str, created_by: str):
    """Get or create organisasi."""
    organisasi_collection = db["organisasi"]
    
    # Cari organisasi
    existing = await organisasi_collection.find_one({
        "nama": {"$regex": f"^{nama_organisasi}$", "$options": "i"}
    })
    
    if existing:
        return str(existing["_id"])
    
    # Buat organisasi baru
    now_str = datetime.now(WIB).isoformat()
    new_org = {
        "nama": nama_organisasi,
        "created_at": now_str,
        "created_by": created_by
    }
    
    result = await organisasi_collection.insert_one(new_org)
    print(f"   ✓ Organisasi dibuat: {nama_organisasi}")
    return str(result.inserted_id)


async def create_user(db, user_data):
    """Create user dengan organisasi."""
    users_collection = db["users"]
    
    # Cek apakah user sudah ada
    existing = await users_collection.find_one({"email": user_data["email"]})
    if existing:
        print(f"   ⚠ User sudah ada: {user_data['email']}")
        return str(existing["_id"])
    
    # Hash password
    hashed_password = hash_password(user_data["password"])
    
    # Get or create organisasi
    organisasi_id = await get_or_create_organisasi(
        db, 
        user_data["organisasi"],
        "system"
    )
    
    # Create user
    now_str = datetime.now(WIB).isoformat()
    user_doc = {
        "email": user_data["email"],
        "password": hashed_password,
        "name": user_data["name"],
        "organisasi_id": organisasi_id,
        "role": user_data["role"],
        "created_at": now_str
    }
    
    result = await users_collection.insert_one(user_doc)
    print(f"   ✓ User dibuat: {user_data['name']} ({user_data['email']})")
    return str(result.inserted_id)


async def create_activities_for_user(db, cassandra_session, user_id: str, user_email: str, user_name: str, organisasi_name: str, num_days: int = 7):
    """Create random activities for user untuk beberapa hari terakhir dengan hash chain."""
    activities_collection = db["activity_logs"]
    
    print(f"   📊 Membuat aktivitas untuk {user_name}...")
    
    # Get last hash untuk user ini (jika sudah ada activity sebelumnya)
    last_activity = await activities_collection.find_one(
        {"user_id": user_id},
        sort=[("timestamp", -1)]
    )
    previous_hash = last_activity["current_hash"] if last_activity else "0" * 64
    
    total_emission = 0
    activities_created = 0
    
    # Collect activities to insert with proper ordering
    activities_to_insert = []
    
    for day in range(num_days):
        # Random 1-4 activities per day
        num_activities = random.randint(1, 4)
        
        for _ in range(num_activities):
            # Random activity template
            template = random.choice(ACTIVITY_TEMPLATES)
            activity_type = template["activity_type"]
            
            # Generate activity data
            now = datetime.now(WIB) - timedelta(days=num_days - day - 1)  # Oldest first
            # Random waktu di hari tersebut
            hour = random.randint(6, 22)
            minute = random.randint(0, 59)
            activity_time = now.replace(hour=hour, minute=minute, second=0, microsecond=0)
            
            activity_doc = {
                "user_id": user_id,
                "activity_type": activity_type,
                "timestamp": activity_time.isoformat(),
                "created_at": activity_time.isoformat(),
                "emission_unit": "kg CO2e"
            }
            
            # Add specific fields based on activity type
            if activity_type in ["car", "motorcycle", "bus"]:
                distance = random.choice(template["distance_km"])
                activity_doc["distance_km"] = distance
                activity_doc["description"] = random.choice(template["descriptions"])
                
                # Calculate emission (simplified)
                if activity_type == "car":
                    emission = distance * 0.192  # kg CO2e per km
                elif activity_type == "motorcycle":
                    emission = distance * 0.084
                else:  # bus
                    emission = distance * 0.089
            
            elif activity_type == "electricity":
                kwh = random.choice(template["kwh"])
                activity_doc["energy_kwh"] = kwh
                activity_doc["description"] = random.choice(template["descriptions"])
                emission = kwh * 0.85  # kg CO2e per kWh
            
            activity_doc["emission"] = round(emission, 2)
            activities_to_insert.append((activity_time, activity_doc, emission))
    
    # Sort by timestamp to ensure proper chain order
    activities_to_insert.sort(key=lambda x: x[0])
    
    # Insert activities in order with hash chain
    for activity_time, activity_doc, emission in activities_to_insert:
        # Generate hash chain
        current_hash = generate_hash(
            previous_hash=previous_hash,
            user_id=user_id,
            activity_type=activity_doc["activity_type"],
            emission=activity_doc["emission"],
            timestamp=activity_doc["timestamp"]
        )
        
        activity_doc["previous_hash"] = previous_hash
        activity_doc["current_hash"] = current_hash
        
        # Insert activity to MongoDB
        result = await activities_collection.insert_one(activity_doc)
        activity_id = str(result.inserted_id)
        
        # Log to Cassandra (audit trail)
        try:
            audit_id = uuid.uuid4()
            # Convert MongoDB ObjectId string to UUID for Cassandra
            # Use UUID5 with DNS namespace for consistent conversion
            user_uuid = uuid.uuid5(uuid.NAMESPACE_DNS, user_id)
            
            cassandra_session.execute(
                """
                INSERT INTO activity_audit (
                    audit_id, user_id, user_email, activity_time, action, 
                    activity_type, emission_kg_co2e, previous_hash, current_hash,
                    description, organisasi_name
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    audit_id,
                    user_uuid,
                    user_email,
                    activity_time,
                    "CREATE",
                    activity_doc["activity_type"],
                    activity_doc["emission"],
                    previous_hash,
                    current_hash,
                    activity_doc.get("description", ""),
                    organisasi_name
                )
            )
        except Exception as e:
            print(f"      ⚠ Gagal log ke Cassandra: {e}")
        
        # Update for next iteration
        previous_hash = current_hash
        total_emission += emission
        activities_created += 1
    
    print(f"      → {activities_created} aktivitas, Total emisi: {total_emission:.2f} kg CO2e")
    return activities_created, total_emission


async def main():
    print("=" * 80)
    print("🌱 ECOLEDGER - SEED 10 USERS WITH ACTIVITIES")
    print("=" * 80)
    print()
    
    # Connect to MongoDB
    print("📡 Connecting to MongoDB...")
    client = AsyncIOMotorClient(MONGO_URI)
    db = client.get_default_database()
    print("   ✓ Connected!")
    print()
    
    # Connect to Cassandra
    print("📡 Connecting to Cassandra...")
    cassandra_session, cassandra_cluster = get_cassandra_session()
    print("   ✓ Connected!")
    print()
    
    # Create users
    print("👥 Creating 10 users with different organisations...")
    print("-" * 80)
    
    user_details = []
    for user_data in USERS_DATA:
        user_id = await create_user(db, user_data)
        user_details.append({
            "id": user_id,
            "name": user_data["name"],
            "email": user_data["email"],
            "organisasi": user_data["organisasi"]
        })
    
    print()
    print("=" * 80)
    print("📊 Creating activities for last 7 days...")
    print("-" * 80)
    
    total_activities = 0
    total_emission_all = 0
    
    for user_detail in user_details:
        activities_count, emission = await create_activities_for_user(
            db, 
            cassandra_session,
            user_detail["id"], 
            user_detail["email"],
            user_detail["name"],
            user_detail["organisasi"],
            num_days=7
        )
        total_activities += activities_count
        total_emission_all += emission
    
    # Close Cassandra connection
    cassandra_cluster.shutdown()
    
    print()
    print("=" * 80)
    print("✨ SEEDING COMPLETED!")
    print("=" * 80)
    print()
    print("📋 Summary:")
    print(f"   ✓ {len(USERS_DATA)} users created")
    print(f"   ✓ {len(set([u['organisasi'] for u in USERS_DATA]))} unique organisations")
    print(f"   ✓ {total_activities} activities created (last 7 days)")
    print(f"   ✓ {total_emission_all:.2f} kg CO2e total emissions")
    print()
    print("🔐 Login Credentials:")
    print("-" * 80)
    for user in USERS_DATA:
        print(f"   Email: {user['email']}")
        print(f"   Password: {user['password']}")
        print(f"   Organisasi: {user['organisasi']}")
        print("-" * 80)
    print()
    
    # Close connection
    client.close()
    print("✅ Done!")


if __name__ == "__main__":
    asyncio.run(main())
