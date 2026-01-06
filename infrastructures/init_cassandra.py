import os
import time
from cassandra.cluster import Cluster
from cassandra.auth import PlainTextAuthProvider

print("⏳ Menunggu Cassandra siap...")

# Configuration
CASSANDRA_HOST = os.environ.get("CASSANDRA_HOST", "cassandra")
CASSANDRA_PORT = int(os.environ.get("CASSANDRA_PORT", "9042"))

# Wait for Cassandra to be ready
for attempt in range(1, 31):
    try:
        cluster = Cluster([CASSANDRA_HOST], port=CASSANDRA_PORT)
        session = cluster.connect()
        print(f"✅ Cassandra reachable (attempt {attempt})")
        break
    except Exception as e:
        wait = 5
        print(f"Cassandra not ready, retrying in {wait}s... (attempt {attempt})")
        time.sleep(wait)
else:
    print("❌ Cassandra tidak tersedia setelah beberapa percobaan, hentikan init.")
    raise SystemExit(1)

try:
    print("🚀 Setup Cassandra Keyspace and Tables...")
    
    # Create keyspace
    session.execute("""
        CREATE KEYSPACE IF NOT EXISTS eco_logs 
        WITH replication = {'class': 'SimpleStrategy', 'replication_factor': 1}
    """)
    print("✅ Keyspace 'eco_logs' created or already exists.")
    
    # Use the keyspace
    session.set_keyspace('eco_logs')
    
    # Create activity_audit table
    session.execute("""
        CREATE TABLE IF NOT EXISTS activity_audit (
            user_id text,
            activity_time timestamp,
            audit_id uuid,
            action_type text,
            entity text,
            entity_id text,
            changes map<text, text>,
            ip_address text,
            description text,
            PRIMARY KEY ((user_id), activity_time, audit_id)
        ) WITH CLUSTERING ORDER BY (activity_time DESC)
    """)
    print("✅ Table 'activity_audit' created or already exists.")
    
    # Verify setup
    rows = session.execute("SELECT * FROM system_schema.tables WHERE keyspace_name = 'eco_logs'")
    tables = [row.table_name for row in rows]
    print(f"📊 Tables in eco_logs: {', '.join(tables)}")
    
    print("\n✨ Setup Cassandra Selesai!")
    
except Exception as e:
    print(f"❌ Error Cassandra: {e}")
    raise

finally:
    cluster.shutdown()
