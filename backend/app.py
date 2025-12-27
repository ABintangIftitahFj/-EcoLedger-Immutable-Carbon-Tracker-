# Di dalam file backend/app.py

from hashing import generate_hash # Import fungsi yang tadi dibuat
from datetime import datetime

# ... (kode setup database mongo) ...

# Contoh saat menerima input user
def create_activity():
    # 1. Terima data dari Frontend
    input_user = request.json 
    user_id = input_user['user_id']
    activity = input_user['activity']  # misal: "Naik Motor"
    emission = input_user['emission']  # misal: 1.5
    
    # 2. Siapkan Timestamp sekarang
    now_str = datetime.now().isoformat() # Hasil: "2024-12-27T18:00:00.123"

    # 3. Ambil Previous Hash dari database (Cari dokumen paling akhir)
    last_doc = db.carbon_logs.find_one(sort=[('_id', -1)])
    
    if last_doc:
        prev_hash = last_doc['current_hash']
    else:
        prev_hash = "0000000000000000" # Genesis block (kalau DB masih kosong)

    # 4. === MAGIC MOMENT: GENERATE HASH ===
    # Masukkan semua komponen tadi ke fungsi hashing
    current_hash = generate_hash(prev_hash, user_id, activity, emission, now_str)

    # 5. Simpan ke MongoDB (Lengkap dengan hash)
    new_doc = {
        "user_id": user_id,
        "activity": activity,
        "emission": emission,
        "timestamp": now_str,
        "previous_hash": prev_hash, # Disimpan biar bisa dicek nanti
        "current_hash": current_hash # Kunci pengaman
    }
    
    db.carbon_logs.insert_one(new_doc)
    return {"status": "success", "data": new_doc}