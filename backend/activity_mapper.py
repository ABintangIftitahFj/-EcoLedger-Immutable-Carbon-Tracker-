"""
=============================================================================
ACTIVITY_MAPPER.PY - Pemetaan Tipe Aktivitas ke Climatiq
=============================================================================

File ini bertanggung jawab untuk memetakan tipe aktivitas yang mudah
dipahami user (seperti "car", "motorbike") ke activity ID yang digunakan
oleh Climatiq API untuk kalkulasi emisi karbon.

Mengapa Diperlukan Mapper?
--------------------------
Climatiq API menggunakan ID yang sangat spesifik dan panjang seperti:
"passenger_vehicle-vehicle_type_car-fuel_source_na-engine_size_na-..."

User tidak mungkin mengingat atau mengetik ID seperti itu. Mapper ini
menjembatani antara input user yang sederhana dengan format Climatiq.

Strategi Mapping:
-----------------
1. Beberapa tipe aktivitas (car, motorbike) sudah diverifikasi ada di Climatiq
2. Tipe aktivitas spesifik (car_petrol_medium) di-fallback ke tipe generik
   karena tidak semua variasi tersedia di database Climatiq
3. Parameter (distance_km, energy_kwh) ditentukan berdasarkan kategori

Author: EcoLedger Team
Version: 1.0.0
=============================================================================
"""

from typing import Dict, Optional


class ActivityMapper:
    """
    Mapper untuk mengkonversi tipe aktivitas user ke Climatiq activity ID.
    
    Class ini menggunakan class methods dan class variables karena:
    1. Tidak perlu state per-instance
    2. Bisa diakses langsung tanpa instantiation
    3. Mapping bersifat konstanta yang tidak berubah runtime
    
    Penggunaan:
        # Cek apakah tipe valid
        if ActivityMapper.is_valid_activity("car"):
            # Dapatkan Climatiq ID
            climatiq_id = ActivityMapper.get_climatiq_id("car")
            # Dapatkan tipe parameter
            param_type = ActivityMapper.get_parameter_type("car")  # "distance"
    """
    
    # =========================================================================
    # MAPPING AKTIVITAS TRANSPORTASI
    # =========================================================================
    # Semua ID di bawah ini sudah diverifikasi bisa digunakan di Climatiq API.
    # Format: "nama_user_friendly": "climatiq_activity_id"
    
    TRANSPORT_MAPPING: Dict[str, str] = {
        # -----------------------------------------------------------------
        # MOBIL - ID yang sudah dikonfirmasi ada di Climatiq
        # -----------------------------------------------------------------
        # ID generik untuk mobil, berlaku untuk semua jenis bahan bakar
        "car": "passenger_vehicle-vehicle_type_car-fuel_source_na-engine_size_na-vehicle_age_na-vehicle_weight_na",
        
        # Mobil listrik (Battery Electric Vehicle)
        "car_electric": "passenger_vehicle-vehicle_type_car-fuel_source_bev-engine_size_na-vehicle_age_na-vehicle_weight_na",
        
        # Mobil hybrid (Hybrid Electric Vehicle)
        "car_hybrid": "passenger_vehicle-vehicle_type_car-fuel_source_hev-engine_size_na-vehicle_age_na-vehicle_weight_na",
        
        # -----------------------------------------------------------------
        # ALIAS MOBIL - Fallback ke ID generik
        # -----------------------------------------------------------------
        # Tipe-tipe spesifik ini tidak ada di Climatiq database,
        # jadi kita arahkan ke ID mobil generik agar tetap bisa digunakan
        # dan user tidak mendapat error
        
        "car_petrol": "passenger_vehicle-vehicle_type_car-fuel_source_na-engine_size_na-vehicle_age_na-vehicle_weight_na",
        "car_petrol_small": "passenger_vehicle-vehicle_type_car-fuel_source_na-engine_size_na-vehicle_age_na-vehicle_weight_na",
        "car_petrol_medium": "passenger_vehicle-vehicle_type_car-fuel_source_na-engine_size_na-vehicle_age_na-vehicle_weight_na",
        "car_petrol_large": "passenger_vehicle-vehicle_type_car-fuel_source_na-engine_size_na-vehicle_age_na-vehicle_weight_na",
        
        "car_diesel": "passenger_vehicle-vehicle_type_car-fuel_source_na-engine_size_na-vehicle_age_na-vehicle_weight_na",
        "car_diesel_small": "passenger_vehicle-vehicle_type_car-fuel_source_na-engine_size_na-vehicle_age_na-vehicle_weight_na",
        "car_diesel_medium": "passenger_vehicle-vehicle_type_car-fuel_source_na-engine_size_na-vehicle_age_na-vehicle_weight_na",
        "car_diesel_large": "passenger_vehicle-vehicle_type_car-fuel_source_na-engine_size_na-vehicle_age_na-vehicle_weight_na",
        
        # -----------------------------------------------------------------
        # MOTOR - Sepeda motor
        # -----------------------------------------------------------------
        "motorbike": "passenger_vehicle-vehicle_type_motorbike-fuel_source_na-engine_size_na-vehicle_age_na-vehicle_weight_na",
        "motorcycle": "passenger_vehicle-vehicle_type_motorbike-fuel_source_na-engine_size_na-vehicle_age_na-vehicle_weight_na",  # Alias
        
        # -----------------------------------------------------------------
        # TRANSPORTASI UMUM
        # -----------------------------------------------------------------
        "bus": "passenger_vehicle-vehicle_type_bus-fuel_source_na-engine_size_na-vehicle_age_na-vehicle_weight_na",
        "train": "passenger_vehicle-vehicle_type_train-fuel_source_na-engine_size_na-vehicle_age_na-vehicle_weight_na",
        "taxi": "passenger_vehicle-vehicle_type_taxi-fuel_source_na-engine_size_na-vehicle_age_na-vehicle_weight_na",
    }
    
    # =========================================================================
    # MAPPING AKTIVITAS ENERGI
    # =========================================================================
    # Untuk kalkulasi emisi dari penggunaan listrik dan gas
    
    ENERGY_MAPPING: Dict[str, str] = {
        # Listrik dengan grid mix Indonesia
        "electricity_id": "electricity-energy_source_grid_mix-id",
        
        # Listrik dengan grid mix generik (untuk negara lain)
        "electricity_grid": "electricity-energy_source_grid_mix",
        
        # Pembakaran gas alam
        "natural_gas": "fuel_combustion-fuel_type_natural_gas",
    }
    
    # =========================================================================
    # GABUNGAN SEMUA MAPPING
    # =========================================================================
    # Digunakan untuk validasi dan lookup
    
    ACTIVITY_MAPPING: Dict[str, str] = {
        **TRANSPORT_MAPPING,  # Spread operator: gabungkan semua dari transport
        **ENERGY_MAPPING,     # Gabungkan semua dari energy
    }
    
    # =========================================================================
    # TIPE PARAMETER UNTUK SETIAP AKTIVITAS
    # =========================================================================
    # Menentukan parameter apa yang digunakan untuk kalkulasi:
    # - "distance": membutuhkan distance_km
    # - "energy": membutuhkan energy_kwh
    
    PARAMETER_TYPE: Dict[str, str] = {
        # Semua transportasi menggunakan jarak (distance)
        **{k: "distance" for k in TRANSPORT_MAPPING.keys()},
        
        # Semua aktivitas energi menggunakan kilowatt-hour
        **{k: "energy" for k in ENERGY_MAPPING.keys()},
    }
    
    # =========================================================================
    # CLASS METHODS - Untuk Akses Mapping
    # =========================================================================
    
    @classmethod
    def get_climatiq_id(cls, activity_type: str) -> Optional[str]:
        """
        Mendapatkan Climatiq activity ID dari tipe aktivitas user.
        
        Method ini adalah core mapper yang mengkonversi input user
        ke format yang dibutuhkan Climatiq API.
        
        Args:
            activity_type: Tipe aktivitas dari user (case-insensitive)
                          Contoh: "car", "CAR", "Car" semuanya valid
        
        Returns:
            str: Climatiq activity ID jika ditemukan
            None: Jika activity_type tidak ada di mapping
        
        Example:
            >>> ActivityMapper.get_climatiq_id("car")
            "passenger_vehicle-vehicle_type_car-fuel_source_na-..."
            
            >>> ActivityMapper.get_climatiq_id("unknown")
            None
        """
        # Lowercase untuk case-insensitive matching
        return cls.ACTIVITY_MAPPING.get(activity_type.lower())
    
    @classmethod
    def get_parameter_type(cls, activity_type: str) -> str:
        """
        Mendapatkan tipe parameter yang dibutuhkan untuk aktivitas.
        
        Setiap aktivitas membutuhkan parameter yang berbeda:
        - Transportasi → distance (dalam km)
        - Listrik → energy (dalam kWh)
        
        Args:
            activity_type: Tipe aktivitas dari user
        
        Returns:
            str: Tipe parameter ('distance', 'energy', 'money', 'weight')
                 Default 'distance' jika tidak ditemukan
        
        Example:
            >>> ActivityMapper.get_parameter_type("car")
            "distance"
            
            >>> ActivityMapper.get_parameter_type("electricity_id")
            "energy"
        """
        return cls.PARAMETER_TYPE.get(activity_type.lower(), "distance")
    
    @classmethod
    def is_valid_activity(cls, activity_type: str) -> bool:
        """
        Mengecek apakah tipe aktivitas valid (ada di mapping).
        
        Digunakan untuk validasi input sebelum memanggil Climatiq API.
        Lebih baik validasi dulu daripada dapat error dari API.
        
        Args:
            activity_type: Tipe aktivitas yang ingin dicek
        
        Returns:
            bool: True jika valid, False jika tidak
        
        Example:
            >>> ActivityMapper.is_valid_activity("car")
            True
            
            >>> ActivityMapper.is_valid_activity("helicopter")
            False
        """
        return activity_type.lower() in cls.ACTIVITY_MAPPING
    
    @classmethod
    def get_all_activities(cls) -> Dict[str, str]:
        """
        Mendapatkan semua mapping aktivitas yang tersedia.
        
        Berguna untuk endpoint yang menampilkan daftar aktivitas
        ke user atau untuk dokumentasi.
        
        Returns:
            Dict[str, str]: Copy dari semua mapping (agar tidak bisa dimodifikasi)
        """
        return cls.ACTIVITY_MAPPING.copy()
    
    @classmethod
    def get_transport_activities(cls) -> Dict[str, str]:
        """
        Mendapatkan mapping khusus aktivitas transportasi.
        
        Returns:
            Dict[str, str]: Mapping aktivitas transportasi saja
        """
        return cls.TRANSPORT_MAPPING.copy()
    
    @classmethod
    def get_energy_activities(cls) -> Dict[str, str]:
        """
        Mendapatkan mapping khusus aktivitas energi.
        
        Returns:
            Dict[str, str]: Mapping aktivitas energi saja
        """
        return cls.ENERGY_MAPPING.copy()
