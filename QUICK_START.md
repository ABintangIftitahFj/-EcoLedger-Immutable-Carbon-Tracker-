# 🚀 EcoLedger Backend - Quick Start Guide

## Prerequisites

- Python 3.10 or higher
- Anaconda/Miniconda (or Python venv)
- Docker and Docker Compose
- Climatiq API key ([Get one here](https://www.climatiq.io/))

---

## Step 1: Setup Docker Containers

Navigate to the infrastructures folder and start Docker services:

```bash
cd infrastructures
docker-compose up -d
```

This will start:
- **MongoDB** on port 27017
- **Cassandra** on port 9042
- **Mongo Express** (MongoDB GUI) on port 8081

---

## Step 2: Create Conda Environment

```bash
# Create environment
conda create -n ecoledger python=3.11 -y

# Activate environment
conda activate ecoledger
```

---

## Step 3: Install Dependencies

```bash
# Install Python dependencies
pip install -r infrastructures/requirements.txt
```

---

## Step 4: Initialize Databases

```bash
# Initialize MongoDB
python infrastructures/init_db.py

# Initialize Cassandra (wait 30 seconds for Cassandra to be ready)
docker exec -i eco_cassandra cqlsh < infrastructures/cassandra_schema.cql
```

---

## Step 5: Configure Environment Variables

Edit the `.env` file in the root directory:

```bash
# REQUIRED: Add your Climatiq API key
CLIMATIQ_API_KEY=your_actual_api_key_here

# REQUIRED: Add a secret key (generate random string)
SECRET_KEY=your_random_secret_key_here

# Optional: Modify other settings as needed
```

**Get Climatiq API Key:**
1. Sign up at https://www.climatiq.io/
2. Go to Dashboard → API Keys
3. Copy your API key
4. Paste it in `.env`

---

## Step 6: Run the Backend

```bash
# Navigate to backend folder
cd backend

# Run with uvicorn
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

**Output should show:**
```
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

---

## Step 7: Test the API

### Option 1: Swagger UI (Recommended)

Open your browser and go to:
```
http://localhost:8000/docs
```

You'll see interactive API documentation where you can test all endpoints!

### Option 2: curl Command

```bash
# Health check
curl http://localhost:8000/api/health

# Get available activity types
curl http://localhost:8000/api/activity-types

# Estimate emission
curl -X POST "http://localhost:8000/api/estimate" \
  -H "Content-Type: application/json" \
  -d '{
    "activity_type": "car_petrol_medium",
    "distance_km": 10
  }'

# Create activity
curl -X POST "http://localhost:8000/api/activities" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user123",
    "activity_type": "car_petrol_medium",
    "distance_km": 25.5,
    "description": "Commute to office"
  }'

# Get activities
curl "http://localhost:8000/api/activities?user_id=user123"

# Verify hash chain
curl http://localhost:8000/api/verify-chain
```

---

## Common Issues & Solutions

### Issue 1: "Connection refused" to MongoDB

**Solution:** Make sure Docker containers are running:
```bash
docker ps
```

If not running:
```bash
cd infrastructures
docker-compose up -d
```

### Issue 2: "Climatiq API error: 401 Unauthorized"

**Solution:** Check your API key in `.env` file:
- Make sure `CLIMATIQ_API_KEY` is set correctly
- No quotes around the key
- No extra spaces

### Issue 3: "Module not found" errors

**Solution:** Make sure you're in the right directory and environment:
```bash
# Check if in conda environment
conda env list  # Should show * next to ecoledger

# If not, activate it
conda activate ecoledger

# Reinstall dependencies
pip install -r infrastructures/requirements.txt
```

### Issue 4: Port already in use

**Solution:** Change the port in `app.py` or `.env`:
```python
# In .env
APP_PORT=8001
```

Then run:
```bash
uvicorn app:app --reload --host 0.0.0.0 --port 8001
```

---

## Viewing Data

### MongoDB (via Mongo Express)

Open browser: http://localhost:8081

Navigate to: `eco_ledger_db` → `activity_logs`

### MongoDB (via CLI)

```bash
docker exec -it eco_mongo mongosh
use eco_ledger_db
db.activity_logs.find().pretty()
```

---

## Stopping the Application

### Stop Backend
Press `Ctrl+C` in the terminal running uvicorn

### Stop Docker Containers
```bash
cd infrastructures
docker-compose down
```

### Deactivate Conda Environment
```bash
conda deactivate
```

---

## Next Steps

1. **Build Frontend**: Create a React/Vue/Angular frontend that consumes this API
2. **Add Authentication**: Implement JWT authentication for secure access
3. **Add Cassandra Audit Logging**: Log all changes to Cassandra for audit trail
4. **Deploy to Production**: Deploy to AWS/GCP/Azure with proper environment variables

---

## Directory Structure

```
EcoLedger-Immutable-Carbon-Tracker/
├── backend/
│   ├── app.py                    # Main FastAPI application
│   ├── models.py                 # Pydantic models
│   ├── config.py                 # Configuration
│   ├── database.py               # MongoDB connection
│   ├── climatiq_service.py       # Climatiq API client
│   ├── activity_mapper.py        # Activity type mapper
│   ├── hashing.py                # Hash generation
│   └── API_DOCUMENTATION.md      # API docs
├── infrastructures/
│   ├── docker-compose.yaml       # Docker services
│   ├── init_db.py                # MongoDB init script
│   ├── cassandra_schema.cql      # Cassandra schema
│   └── requirements.txt          # Python dependencies
├── .env                          # Environment variables (SECRET!)
├── .env.example                  # Example env file
└── README.md                     # Project overview
```

---

## API Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/activities` | Create activity |
| GET | `/api/activities` | Get activities (paginated) |
| GET | `/api/activities/{id}` | Get specific activity |
| POST | `/api/estimate` | Estimate emission (no save) |
| GET | `/api/verify-chain` | Verify hash chain |
| GET | `/api/activity-types` | Get available activity types |
| GET | `/api/emission-factors/search` | Search Climatiq database |
| GET | `/docs` | Swagger UI |
| GET | `/redoc` | ReDoc documentation |

---

## Support

For issues or questions, check:
- **Swagger UI**: http://localhost:8000/docs
- **API Documentation**: `backend/API_DOCUMENTATION.md`
- **Climatiq Docs**: https://docs.climatiq.io/

Happy coding! 🌍💚
