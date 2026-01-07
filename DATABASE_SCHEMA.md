# EcoLedger Database Schema Documentation

## Overview
EcoLedger menggunakan 2 database:
- **MongoDB**: Menyimpan data transaksional (users, activities, organisasi)
- **Cassandra**: Menyimpan audit trail immutable untuk compliance

---

## MongoDB Schema

### Database: `eco_ledger_db`

#### 1. Collection: `users`
Menyimpan informasi pengguna sistem.

```javascript
{
  "_id": ObjectId("695e64391d7438e35466234c"),
  "email": "user@example.com",           // String, unique, required
  "password": "hashed_password",          // String, bcrypt hash
  "name": "John Doe",                     // String, required
  "organisasi_id": ObjectId("..."),       // Reference to organisasi._id
  "role": "user",                         // Enum: "user" | "admin"
  "created_at": "2026-01-07T10:30:00+07:00"  // ISO 8601 datetime
}
```

**Indexes:**
- `email` (unique)
- `organisasi_id`
- `role`

---

#### 2. Collection: `activity_logs`
Menyimpan log aktivitas karbon dengan blockchain-like hash chain.

```javascript
{
  "_id": ObjectId("695e627732b76ba1a989db30"),
  "user_id": "695e64391d7438e35466234c",  // String (ObjectId as string)
  "activity_type": "car",                 // String: car, motorcycle, bus, electricity
  "emission": 3.82,                       // Float, total emission in kg CO2e
  "emission_unit": "kg CO2e",             // String, default "kg CO2e"
  "timestamp": "2026-01-07T20:41:11+07:00",  // ISO 8601 datetime
  
  // Blockchain Hash Chain
  "previous_hash": "0000...0000",         // SHA-256 hash (64 chars) of previous record
  "current_hash": "efaa194b4d1db138...",  // SHA-256 hash of this record
  
  // Activity Details
  "description": "Meeting klien",         // String, optional
  "distance_km": 20.0,                    // Float, untuk transport
  "energy_kwh": null,                     // Float, untuk electricity
  "weight_kg": null,                      // Float, untuk waste
  "money_spent": null,                    // Float, optional
  
  // Climatiq API Response
  "climatiq_data": {
    "co2e": 3.82,
    "co2e_unit": "kg",
    "activity_id": "passenger_vehicle-vehicle_type_car-...",
    "emission_factor": {
      "name": "Car",
      "activity_id": "...",
      "id": "79971ef4-26cb-44da-b151-0ebecf4fd697",
      "source": "CO2 Emissiefactoren",
      "year": 2025,
      "region": "NL"
    },
    "parameters": {
      "distance": 20.0,
      "distance_unit": "km"
    }
  },
  
  "created_at": "2026-01-07T20:41:11+07:00"
}
```

**Indexes:**
- `user_id`
- `timestamp` (descending)
- `activity_type`
- Compound: `(user_id, timestamp DESC)`

**Hash Chain Rules:**
- First record: `previous_hash = "0" * 64` (genesis block)
- Subsequent records: `previous_hash = previous_record.current_hash`
- Hash calculation: `SHA256(previous_hash + user_id + activity_type + emission + timestamp)`

---

#### 3. Collection: `organisasi`
Menyimpan informasi organisasi/perusahaan.

```javascript
{
  "_id": ObjectId("695e64381d7438e354662348"),
  "name": "PT Green Technology Indonesia",  // String, required
  "description": "Perusahaan teknologi hijau",  // String, optional
  "address": "Jakarta",                     // String, optional
  "phone": "+62-21-12345678",              // String, optional
  "email": "info@greentech.com",           // String, optional
  "created_by": "695e64391d7438e35466234c", // User ID who created
  "created_at": "2026-01-07T10:00:00+07:00",
  "updated_at": "2026-01-07T10:00:00+07:00"
}
```

**Indexes:**
- `name`
- `created_by`

---

## Cassandra Schema

### Keyspace: `eco_logs`

```cql
CREATE KEYSPACE IF NOT EXISTS eco_logs 
WITH replication = {
  'class': 'SimpleStrategy', 
  'replication_factor': 1
};
```

---

### Table: `activity_audit`
Menyimpan audit trail immutable untuk compliance dan tracking.

```cql
CREATE TABLE IF NOT EXISTS activity_audit (
    -- Primary Key Components
    user_id text,                    -- Partition key: user identifier
    activity_time timestamp,         -- Clustering key 1: when action occurred
    audit_id uuid,                   -- Clustering key 2: unique audit entry
    
    -- Audit Information
    action_type text,                -- Action: CREATE, UPDATE, DELETE, LOGIN, LOGOUT
    entity text,                     -- Entity type: activity, user, organisasi
    entity_id text,                  -- ID of the entity affected
    
    -- Additional Context
    changes map<text, text>,         -- Key-value pairs of changes made
    ip_address text,                 -- Client IP address
    user_name text,                  -- Human-readable user name
    user_organisasi text,            -- User's organization name
    description text,                -- Human-readable description
    
    PRIMARY KEY ((user_id), activity_time, audit_id)
) WITH CLUSTERING ORDER BY (activity_time DESC, audit_id ASC);
```

**Key Design:**
- **Partition Key**: `user_id` - all audits for one user in same partition
- **Clustering Keys**: 
  - `activity_time DESC` - newest first
  - `audit_id ASC` - unique identifier for same-time events

**Query Patterns:**
```cql
-- Get all audits for a user
SELECT * FROM activity_audit WHERE user_id = '...';

-- Get recent audits for a user
SELECT * FROM activity_audit 
WHERE user_id = '...' 
LIMIT 100;

-- Get audits in time range
SELECT * FROM activity_audit 
WHERE user_id = '...' 
AND activity_time >= '2026-01-01' 
AND activity_time <= '2026-01-31';
```

---

## Data Flow

### 1. User Registration
```
Frontend → POST /api/auth/register
         → MongoDB: Insert to users collection
         → Cassandra: Log REGISTER action
```

### 2. Create Activity
```
Frontend → POST /api/activities
         → Climatiq API: Get emission factor
         → MongoDB: Insert to activity_logs (with hash chain)
         → Cassandra: Log CREATE action
```

### 3. Verify Hash Chain
```
Frontend → GET /api/verify-chain
         → MongoDB: Query activity_logs for user
         → Validate hash chain integrity
         → Return verification status
```

---

## Backup & Recovery

### MongoDB Backup
```bash
# Full backup
docker exec eco_mongo mongodump --out /backup/$(date +%Y%m%d)

# Restore
docker exec eco_mongo mongorestore /backup/20260107
```

### Cassandra Backup
```bash
# Snapshot
docker exec eco_cassandra nodetool snapshot eco_logs

# Export to CSV
docker exec eco_cassandra cqlsh -e "COPY eco_logs.activity_audit TO '/backup/audit.csv'"
```

---

## Data Retention

- **MongoDB**: No automatic retention (manual cleanup)
- **Cassandra**: No TTL (permanent audit trail for compliance)

---

## Security Considerations

1. **Password Hashing**: Bcrypt with salt (via passlib)
2. **Hash Chain**: SHA-256 for immutability verification
3. **Audit Trail**: Immutable records in Cassandra
4. **JWT Token**: 24-hour expiration
5. **API Rate Limiting**: Recommended for production

---

## Sample Queries

### MongoDB Queries

```javascript
// Find user activities
db.activity_logs.find({ user_id: "695e64391d7438e35466234c" })
  .sort({ timestamp: -1 })
  .limit(10);

// Calculate total emissions
db.activity_logs.aggregate([
  { $match: { user_id: "695e64391d7438e35466234c" } },
  { $group: { 
      _id: null, 
      total: { $sum: "$emission" },
      count: { $sum: 1 }
  }}
]);

// Verify hash chain
const activities = db.activity_logs.find({ user_id: "..." })
  .sort({ timestamp: 1 })
  .toArray();
```

### Cassandra Queries

```cql
-- Get user audit trail
SELECT * FROM activity_audit 
WHERE user_id = '695e64391d7438e35466234c' 
LIMIT 50;

-- Count audits by action type
SELECT action_type, COUNT(*) 
FROM activity_audit 
WHERE user_id = '695e64391d7438e35466234c' 
GROUP BY action_type;
```

---

## Migration Notes

### Adding New Fields to activity_logs

1. Add field to MongoDB schema (no migration needed - NoSQL)
2. Update backend models.py
3. Update frontend TypeScript interfaces
4. Seed script: Include new fields in seed data

### Adding Columns to Cassandra

```cql
ALTER TABLE activity_audit ADD new_column text;
```

Note: Cannot remove columns in Cassandra v3.x without recreating table.

---

## Performance Tuning

### MongoDB Indexes
```javascript
// Create compound index for common query
db.activity_logs.createIndex({ user_id: 1, timestamp: -1 });

// Create index for admin dashboard
db.activity_logs.createIndex({ timestamp: -1 });
```

### Cassandra Tuning
```cql
-- Increase read timeout for slow queries
ALTER TABLE activity_audit WITH read_repair_chance = 0.1;

-- Compression for large datasets
ALTER TABLE activity_audit WITH compression = {
  'class': 'LZ4Compressor'
};
```
