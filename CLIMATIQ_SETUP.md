# 🌍 Climatiq API Setup Guide

## Apa itu Climatiq?

**Climatiq** adalah API untuk menghitung emisi karbon dari berbagai aktivitas. API ini menyediakan data emission factors yang akurat dan ter-update untuk berbagai jenis aktivitas seperti:
- 🚗 Transportasi (mobil, motor, pesawat, kereta)
- ⚡ Konsumsi energi (listrik, gas)
- 🏭 Industri dan manufaktur
- 🍔 Makanan dan minuman

## 📝 Cara Mendapatkan API Key

### 1. Daftar di Climatiq
1. Kunjungi: https://www.climatiq.io/
2. Klik **"Get Started"** atau **"Sign Up"**
3. Daftar menggunakan email atau GitHub

### 2. Dapatkan API Key
1. Login ke dashboard Climatiq
2. Pergi ke **"API Keys"** di menu
3. Copy API key Anda

### 3. Masukkan ke File .env
1. Buka file `.env` di root project
2. Ganti `your_climatiq_api_key_here` dengan API key Anda:
   ```
   CLIMATIQ_API_KEY=sk_live_xxxxxxxxxxxxxxxx
   ```

## 🚀 Cara Menggunakan di Backend

### Install Library
```bash
pip install requests python-dotenv
```

### Contoh Kode Python

```python
import os
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

CLIMATIQ_API_KEY = os.getenv('CLIMATIQ_API_KEY')
CLIMATIQ_API_URL = os.getenv('CLIMATIQ_API_URL')

def calculate_emission(activity_id, distance_km):
    """
    Hitung emisi karbon menggunakan Climatiq API
    
    Args:
        activity_id: ID aktivitas dari Climatiq (misal: 'passenger_vehicle-vehicle_type_car-fuel_source_petrol-engine_size_medium-distance_na')
        distance_km: Jarak dalam kilometer
    
    Returns:
        dict: Response dari Climatiq API dengan data emisi
    """
    
    headers = {
        'Authorization': f'Bearer {CLIMATIQ_API_KEY}',
        'Content-Type': 'application/json'
    }
    
    payload = {
        'emission_factor': {
            'activity_id': activity_id
        },
        'parameters': {
            'distance': distance_km,
            'distance_unit': 'km'
        }
    }
    
    response = requests.post(
        f'{CLIMATIQ_API_URL}/estimate',
        headers=headers,
        json=payload
    )
    
    if response.status_code == 200:
        data = response.json()
        return {
            'co2e': data['co2e'],  # Total emisi dalam kg CO2e
            'co2e_unit': data['co2e_unit'],
            'activity': activity_id
        }
    else:
        raise Exception(f"Climatiq API Error: {response.text}")

# Contoh penggunaan
if __name__ == "__main__":
    # Hitung emisi naik mobil bensin 10 km
    result = calculate_emission(
        activity_id='passenger_vehicle-vehicle_type_car-fuel_source_petrol-engine_size_medium-distance_na',
        distance_km=10
    )
    
    print(f"Emisi: {result['co2e']} {result['co2e_unit']}")
    # Output: Emisi: 2.45 kg
```

## 📚 Activity IDs yang Umum Digunakan

### 🚗 Transportasi
```python
# Mobil bensin (medium)
'passenger_vehicle-vehicle_type_car-fuel_source_petrol-engine_size_medium-distance_na'

# Motor
'passenger_vehicle-vehicle_type_motorbike-fuel_source_petrol-engine_size_medium-distance_na'

# Bus
'passenger_vehicle-vehicle_type_bus-fuel_source_diesel-vehicle_age_na-distance_na'

# Pesawat (short haul)
'passenger_flight-route_type_domestic-aircraft_type_na-distance_na-class_na-rf_na'
```

### ⚡ Energi
```python
# Listrik (Indonesia)
'electricity-energy_source_grid_mix-country_id'

# Gas alam
'fuel_combustion-fuel_type_natural_gas-unit_type_volume'
```

## 🔗 Integrasi dengan EcoLedger

### Update `backend/app.py`

```python
from dotenv import load_dotenv
import os
import requests

load_dotenv()

CLIMATIQ_API_KEY = os.getenv('CLIMATIQ_API_KEY')
CLIMATIQ_API_URL = os.getenv('CLIMATIQ_API_URL')

def create_activity_with_climatiq():
    input_user = request.json
    user_id = input_user['user_id']
    activity_type = input_user['activity_type']  # 'car', 'motorbike', etc
    distance_km = input_user['distance_km']
    
    # Mapping activity type ke Climatiq activity_id
    activity_mapping = {
        'car': 'passenger_vehicle-vehicle_type_car-fuel_source_petrol-engine_size_medium-distance_na',
        'motorbike': 'passenger_vehicle-vehicle_type_motorbike-fuel_source_petrol-engine_size_medium-distance_na',
        'bus': 'passenger_vehicle-vehicle_type_bus-fuel_source_diesel-vehicle_age_na-distance_na'
    }
    
    # Hitung emisi via Climatiq
    headers = {
        'Authorization': f'Bearer {CLIMATIQ_API_KEY}',
        'Content-Type': 'application/json'
    }
    
    payload = {
        'emission_factor': {
            'activity_id': activity_mapping[activity_type]
        },
        'parameters': {
            'distance': distance_km,
            'distance_unit': 'km'
        }
    }
    
    response = requests.post(
        f'{CLIMATIQ_API_URL}/estimate',
        headers=headers,
        json=payload
    )
    
    emission_data = response.json()
    emission = emission_data['co2e']  # dalam kg CO2e
    
    # Lanjutkan dengan hashing seperti biasa
    now_str = datetime.now().isoformat()
    last_doc = db.carbon_logs.find_one(sort=[('_id', -1)])
    prev_hash = last_doc['current_hash'] if last_doc else "0000000000000000"
    
    current_hash = generate_hash(prev_hash, user_id, activity_type, emission, now_str)
    
    new_doc = {
        "user_id": user_id,
        "activity": activity_type,
        "distance_km": distance_km,
        "emission": emission,
        "emission_unit": "kg CO2e",
        "timestamp": now_str,
        "previous_hash": prev_hash,
        "current_hash": current_hash,
        "climatiq_data": emission_data  # Simpan data lengkap dari Climatiq
    }
    
    db.carbon_logs.insert_one(new_doc)
    return {"status": "success", "data": new_doc}
```

## 📊 Free Tier Limits

Climatiq menyediakan **free tier** dengan limit:
- ✅ **100 API calls per bulan**
- ✅ Akses ke semua emission factors
- ✅ Cocok untuk development dan testing

Untuk production, upgrade ke paid plan.

## 🔒 Security Best Practices

1. ✅ **Jangan commit `.env`** ke Git (sudah di-ignore)
2. ✅ **Gunakan `.env.example`** sebagai template
3. ✅ **Rotate API key** secara berkala
4. ✅ **Gunakan environment variables** di production (tidak hardcode)

## 📖 Dokumentasi Lengkap

- **Climatiq Docs:** https://docs.climatiq.io/
- **API Reference:** https://docs.climatiq.io/api-reference/
- **Activity IDs:** https://explorer.climatiq.io/

## 🆘 Troubleshooting

### Error: "Invalid API Key"
- Pastikan API key sudah benar di `.env`
- Pastikan file `.env` sudah di-load dengan `load_dotenv()`

### Error: "Rate limit exceeded"
- Anda sudah melebihi 100 calls/bulan (free tier)
- Upgrade ke paid plan atau tunggu bulan berikutnya

### Error: "Activity ID not found"
- Activity ID salah atau tidak ada
- Cek di: https://explorer.climatiq.io/
