# EcoLedger: Immutable Carbon Tracker

## Cara enggunakan Database
Jalankan perintah berikut dari folder `infrastructures`:

```bash
cd infrastructures
docker-compose up -d
```

### (Opsional) buat virtual environment
```bash
python -m venv venv
```

Aktifkan lingkungan:
- Windows: `venv\Scripts\activate`
- Mac/Linux: `source venv/bin/activate`

Install dependensi (dari folder `infrastructures`):
```bash
pip install -r requirements.txt
```

### Inisialisasi database
Masih di folder `infrastructures`, jalankan:
```bash
python init_db.py
```

Lalu jalankan juga ini:
```bash
docker exec -i eco_cassandra cqlsh < cassandra_schema.cql
```