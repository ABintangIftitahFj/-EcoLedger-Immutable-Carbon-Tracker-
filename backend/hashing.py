import hashlib

def generate_hash(previous_hash, user_id, activity_type, carbon_emission, timestamp):
    """
    Fungsi untuk membuat SHA-256 hash dari data aktivitas.
    Urutan penggabungan string (concatenation) SANGAT PENTING.
    Urutan: prev_hash + user_id + activity + emission + timestamp
    """
    
    # 1. Pastikan semua data diubah jadi String
    # Khusus carbon_emission (float), kita paksa jadi string agar konsisten
    emission_str = str(carbon_emission)
    
    # 2. Gabungkan (Concatenate) jadi satu string panjang tanpa spasi
    # Contoh hasil: "a1b2...user123Transportasi5.52024-12-27T10:00:00"
    payload = f"{previous_hash}{user_id}{activity_type}{emission_str}{timestamp}"
    
    # 3. Lakukan Hashing SHA-256
    # .encode() mengubah string jadi bytes
    # .hexdigest() mengubah bytes jadi string hex (angka dan huruf acak)
    secret_code = hashlib.sha256(payload.encode('utf-8')).hexdigest()
    
    return secret_code