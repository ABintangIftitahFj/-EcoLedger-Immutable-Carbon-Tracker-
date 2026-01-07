# EcoLedger API Documentation

## Overview

EcoLedger is a RESTful API for tracking carbon emissions with blockchain-like immutability. It integrates with the Climatiq API to automatically calculate emissions from various activities.

## Base URL

```
http://localhost:8000
```

## Interactive Documentation

FastAPI provides automatic interactive API documentation:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Authentication

EcoLedger menggunakan **JWT (JSON Web Token)** untuk authentication.

### Register
```http
POST /api/auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "name": "John Doe"
}
```

**Response:**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "user"
}
```

### Login
```http
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user"
  }
}
```

### Get Current User
```http
GET /api/auth/me
```

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "user"
}
```

### Update Profile
```http
PUT /api/auth/profile
```

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "name": "John Doe Updated",
  "email": "newemail@example.com"
}
```

**Response:**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "email": "newemail@example.com",
  "name": "John Doe Updated",
  "role": "user"
}
```

### Change Password
```http
PUT /api/auth/change-password
```

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "current_password": "oldpassword123",
  "new_password": "newpassword456"
}
```

**Response:**
```json
{
  "message": "Password berhasil diubah"
}
```

### Delete Account
```http
DELETE /api/auth/delete-account
```

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "message": "Akun berhasil dihapus",
  "deleted_activities": 30
}
```

**Note:** 
- Menghapus user dan semua aktivitas dari MongoDB
- Audit logs di Cassandra tetap dipertahankan untuk compliance
- Tidak dapat diundo

### Using Authentication

Semua protected endpoints memerlukan header:
```
Authorization: Bearer <access_token>
```

Contoh:
```bash
curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  http://localhost:8000/api/activities
```

## Endpoints

### System Endpoints

#### Health Check
```http
GET /api/health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-12-29T09:00:00.123456",
  "database": "connected",
  "climatiq_api": "configured"
}
```

#### Verify Hash Chain
```http
GET /api/verify-chain
```

Verifies the integrity of the entire blockchain-like hash chain.

**Response:**
```json
{
  "valid": true,
  "total_records": 150,
  "message": "All hashes are valid. Chain integrity verified!"
}
```

---

### Activity Endpoints

#### Create Activity
```http
POST /api/activities
```

Creates a new activity with automatic emission calculation via Climatiq API.

**Request Body:**
```json
{
  "user_id": "user123",
  "activity_type": "car_petrol_medium",
  "distance_km": 25.5,
  "description": "Commute to office"
}
```

**Response:**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "user_id": "user123",
  "activity_type": "car_petrol_medium",
  "emission": 5.875,
  "emission_unit": "kg CO2e",
  "timestamp": "2024-12-29T09:00:00.123456",
  "previous_hash": "0000000000000000...",
  "current_hash": "a3f5b2c8d1e9f4a7...",
  "distance_km": 25.5,
  "description": "Commute to office",
  "climatiq_data": {
    "co2e": 5.875,
    "co2e_unit": "kg",
    "activity_id": "passenger_vehicle-vehicle_type_car-fuel_source_petrol-engine_size_medium-distance_na"
  }
}
```

**curl Example:**
```bash
curl -X POST "http://localhost:8000/api/activities" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user123",
    "activity_type": "car_petrol_medium",
    "distance_km": 25.5,
    "description": "Commute to office"
  }'
```

#### Get Activities
```http
GET /api/activities?user_id=user123&page=1&page_size=10
```

**Query Parameters:**
- `user_id` (optional): Filter by user ID
- `page` (optional, default: 1): Page number
- `page_size` (optional, default: 10): Items per page (max: 100)

**Response:**
```json
{
  "total": 150,
  "page": 1,
  "page_size": 10,
  "activities": [
    {
      "id": "507f1f77bcf86cd799439011",
      "user_id": "user123",
      "activity_type": "car_petrol_medium",
      "emission": 5.875,
      "emission_unit": "kg CO2e",
      "timestamp": "2024-12-29T09:00:00.123456",
      "previous_hash": "0000000000000000...",
      "current_hash": "a3f5b2c8d1e9f4a7...",
      "distance_km": 25.5
    }
  ]
}
```

#### Get Single Activity
```http
GET /api/activities/{activity_id}
```

**Response:**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "user_id": "user123",
  "activity_type": "car_petrol_medium",
  "emission": 5.875,
  "emission_unit": "kg CO2e",
  "timestamp": "2024-12-29T09:00:00.123456",
  "previous_hash": "0000000000000000...",
  "current_hash": "a3f5b2c8d1e9f4a7...",
  "distance_km": 25.5
}
```

---

### Emission Endpoints

#### Estimate Emission (Preview)
```http
POST /api/estimate
```

Calculate emission estimate without saving to database. Useful for previewing emissions.

**Request Body:**
```json
{
  "activity_type": "motorbike",
  "distance_km": 10.0
}
```

**Response:**
```json
{
  "activity_type": "motorbike",
  "emission": 1.234,
  "emission_unit": "kg CO2e",
  "climatiq_activity_id": "passenger_vehicle-vehicle_type_motorbike-fuel_source_petrol-engine_size_medium-distance_na",
  "parameters": {
    "distance": 10.0,
    "distance_unit": "km"
  }
}
```

#### Search Emission Factors
```http
GET /api/emission-factors/search?query=car&limit=10
```

Search for emission factors in the Climatiq database.

**Query Parameters:**
- `query` (optional): Search query
- `category` (optional): Filter by category
- `region` (optional): Filter by region (e.g., "ID" for Indonesia)
- `limit` (optional, default: 10): Maximum results

---

### Dashboard Endpoints

#### Get Dashboard Statistics
```http
GET /api/dashboard/stats
```

Mendapatkan data untuk grafik dashboard dari MongoDB.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "pie_chart": {
    "labels": ["Transport", "Electricity", "Food"],
    "data": [45.5, 23.2, 15.8]
  },
  "line_chart": {
    "labels": ["2026-01-03", "2026-01-04", "2026-01-05"],
    "data": [45.5, 67.2, 89.1]
  }
}
```

#### Get Audit Logs
```http
GET /api/dashboard/logs
```

Mendapatkan audit logs dari Cassandra untuk user yang sedang login.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "logs": [
    {
      "user": "john@example.com",
      "action": "CREATE",
      "time": "2026-01-05T10:30:00",
      "status": "Success"
    },
    {
      "user": "john@example.com",
      "action": "LOGIN",
      "time": "2026-01-05T09:15:00",
      "status": "Success"
    }
  ]
}
```

---

### Reference Endpoints

#### Get Activity Types
```http
GET /api/activity-types
```

Get all available activity types.

**Response:**
```json
{
  "total": 20,
  "categories": {
    "transportation": {
      "count": 15,
      "activities": [
        "car_petrol_small",
        "car_petrol_medium",
        "car_petrol_large",
        "motorbike",
        "bus",
        "train"
      ]
    },
    "energy": {
      "count": 3,
      "activities": [
        "electricity_id",
        "electricity_grid",
        "natural_gas"
      ]
    }
  },
  "all_activities": [
    "car_petrol_small",
    "car_petrol_medium",
    "motorbike",
    "bus",
    "electricity_id"
  ]
}
```

---

## Activity Types

### Transportation

| Activity Type | Description | Parameter |
|--------------|-------------|-----------|
| `car_petrol_small` | Small petrol car | `distance_km` |
| `car_petrol_medium` | Medium petrol car | `distance_km` |
| `car_petrol_large` | Large petrol car | `distance_km` |
| `car_diesel_small` | Small diesel car | `distance_km` |
| `car_diesel_medium` | Medium diesel car | `distance_km` |
| `car_diesel_large` | Large diesel car | `distance_km` |
| `car_electric` | Electric car (BEV) | `distance_km` |
| `car_hybrid` | Hybrid car (PHEV) | `distance_km` |
| `motorbike` | Medium motorbike | `distance_km` |
| `motorbike_small` | Small motorbike | `distance_km` |
| `motorbike_large` | Large motorbike | `distance_km` |
| `bus` | Diesel bus | `distance_km` |
| `train` | National rail | `distance_km` |
| `subway` | Light rail/subway | `distance_km` |
| `flight_domestic` | Domestic flight (economy) | `distance_km` |
| `flight_short_haul` | Short haul flight (economy) | `distance_km` |
| `flight_long_haul` | Long haul flight (economy) | `distance_km` |

### Energy

| Activity Type | Description | Parameter |
|--------------|-------------|-----------|
| `electricity_id` | Electricity (Indonesia grid mix) | `energy_kwh` |
| `electricity_grid` | Electricity (generic grid mix) | `energy_kwh` |
| `natural_gas` | Natural gas combustion | `energy_kwh` |

---

## Error Responses

All errors follow this format:

```json
{
  "detail": "Error message here"
}
```

### Common HTTP Status Codes

- `200 OK` - Success
- `400 Bad Request` - Invalid input
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error
- `503 Service Unavailable` - Climatiq API unavailable

---

## Examples

### Example 1: Track Car Journey

```bash
# Estimate first
curl -X POST "http://localhost:8000/api/estimate" \
  -H "Content-Type: application/json" \
  -d '{
    "activity_type": "car_petrol_medium",
    "distance_km": 50
  }'

# Create activity
curl -X POST "http://localhost:8000/api/activities" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user123",
    "activity_type": "car_petrol_medium",
    "distance_km": 50,
    "description": "Weekend trip"
  }'
```

### Example 2: Track Electricity Usage

```bash
curl -X POST "http://localhost:8000/api/activities" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user123",
    "activity_type": "electricity_id",
    "energy_kwh": 150,
    "description": "Monthly electricity consumption"
  }'
```

### Example 3: Get User's Carbon Footprint

```bash
# Get all activities for a user
curl "http://localhost:8000/api/activities?user_id=user123&page_size=100"

# Calculate total by summing all emissions
```

### Example 4: Verify Data Integrity

```bash
curl "http://localhost:8000/api/verify-chain"
```

---

## Rate Limiting

Currently, there is no rate limiting. This will be added in future versions.

Climatiq API has its own rate limits:
- Free tier: 100 API calls per month
- Check your Climatiq dashboard for current usage

---

## Support

For issues or questions:
- GitHub: [Your repo link]
- Email: [Your email]

---

## Version History

### v1.0.0 (2024-12-29)
- Initial release
- Climatiq API integration
- Blockchain-like hash chain
- FastAPI with automatic documentation
- CRUD operations for activities
- Emission estimation
- Chain verification
