"""
=============================================================================
ACTIVITY_MAPPER.PY - Pemetaan Tipe Aktivitas ke Climatiq
=============================================================================
CATATAN PENTING:
---------------
Sebagian besar transportasi tersedia di Climatiq API free tier.
Yang TIDAK tersedia: train, subway, electricity, natural_gas

Tested & Verified: ✅ car, motorbike, bus, taxi

Author: EcoLedger Team
Version: 1.0.3
=============================================================================
"""
from typing import Dict, Optional

class ActivityMapper:
    """
    Mapper untuk mengkonversi tipe aktivitas user ke Climatiq activity ID.
    
    Transportasi pribadi dan umum tersedia (kecuali train/subway).
    """
    
    # =========================================================================
    # MAPPING AKTIVITAS TRANSPORTASI - VERIFIED ✅
    # =========================================================================
    
    TRANSPORT_MAPPING: Dict[str, str] = {
        # -----------------------------------------------------------------
        # MOBIL - Verified working ✅
        # -----------------------------------------------------------------
        "car": "passenger_vehicle-vehicle_type_car-fuel_source_na-engine_size_na-vehicle_age_na-vehicle_weight_na",
        "car_electric": "passenger_vehicle-vehicle_type_car-fuel_source_bev-engine_size_na-vehicle_age_na-vehicle_weight_na",
        "car_hybrid": "passenger_vehicle-vehicle_type_car-fuel_source_hev-engine_size_na-vehicle_age_na-vehicle_weight_na",
        
        # Alias mobil - fallback ke generik
        "car_petrol": "passenger_vehicle-vehicle_type_car-fuel_source_na-engine_size_na-vehicle_age_na-vehicle_weight_na",
        "car_petrol_small": "passenger_vehicle-vehicle_type_car-fuel_source_na-engine_size_na-vehicle_age_na-vehicle_weight_na",
        "car_petrol_medium": "passenger_vehicle-vehicle_type_car-fuel_source_na-engine_size_na-vehicle_age_na-vehicle_weight_na",
        "car_petrol_large": "passenger_vehicle-vehicle_type_car-fuel_source_na-engine_size_na-vehicle_age_na-vehicle_weight_na",
        
        "car_diesel": "passenger_vehicle-vehicle_type_car-fuel_source_na-engine_size_na-vehicle_age_na-vehicle_weight_na",
        "car_diesel_small": "passenger_vehicle-vehicle_type_car-fuel_source_na-engine_size_na-vehicle_age_na-vehicle_weight_na",
        "car_diesel_medium": "passenger_vehicle-vehicle_type_car-fuel_source_na-engine_size_na-vehicle_age_na-vehicle_weight_na",
        "car_diesel_large": "passenger_vehicle-vehicle_type_car-fuel_source_na-engine_size_na-vehicle_age_na-vehicle_weight_na",
        
        # -----------------------------------------------------------------
        # MOTOR - Verified working ✅
        # -----------------------------------------------------------------
        "motorbike": "passenger_vehicle-vehicle_type_motorbike-fuel_source_na-engine_size_na-vehicle_age_na-vehicle_weight_na",
        "motorcycle": "passenger_vehicle-vehicle_type_motorbike-fuel_source_na-engine_size_na-vehicle_age_na-vehicle_weight_na",
        "motorbike_small": "passenger_vehicle-vehicle_type_motorbike-fuel_source_na-engine_size_na-vehicle_age_na-vehicle_weight_na",
        "motorbike_large": "passenger_vehicle-vehicle_type_motorbike-fuel_source_na-engine_size_na-vehicle_age_na-vehicle_weight_na",
        
        # -----------------------------------------------------------------
        # TRANSPORTASI UMUM - Verified working ✅
        # -----------------------------------------------------------------
        "bus": "passenger_vehicle-vehicle_type_bus-fuel_source_na-engine_size_na-vehicle_age_na-vehicle_weight_na",
        "taxi": "passenger_vehicle-vehicle_type_taxi-fuel_source_na-engine_size_na-vehicle_age_na-vehicle_weight_na",
    }
    
    # =========================================================================
    # CATATAN: AKTIVITAS TIDAK TERSEDIA ❌
    # =========================================================================
    # Activity ID berikut TIDAK DITEMUKAN di Climatiq database:
    # - train (Error: no_emission_factors_found)
    # - subway (Error: no_emission_factors_found)
    # - electricity (Error: no_emission_factors_found)
    # - natural_gas (Error: no_emission_factors_found)
    #
    # Bus dan Taxi BERFUNGSI dengan baik!
    # =========================================================================
    
    ENERGY_MAPPING: Dict[str, str] = {}
    
    # =========================================================================
    # GABUNGAN SEMUA MAPPING
    # =========================================================================
    
    ACTIVITY_MAPPING: Dict[str, str] = {
        **TRANSPORT_MAPPING,
        **ENERGY_MAPPING,
    }
    
    # =========================================================================
    # TIPE PARAMETER UNTUK SETIAP AKTIVITAS
    # =========================================================================
    
    PARAMETER_TYPE: Dict[str, str] = {
        **{k: "distance" for k in TRANSPORT_MAPPING.keys()},
        **{k: "energy" for k in ENERGY_MAPPING.keys()},
    }
    
    # =========================================================================
    # CLASS METHODS
    # =========================================================================
    
    @classmethod
    def get_climatiq_id(cls, activity_type: str) -> Optional[str]:
        """Mendapatkan Climatiq activity ID dari tipe aktivitas user."""
        return cls.ACTIVITY_MAPPING.get(activity_type.lower())
    
    @classmethod
    def get_parameter_type(cls, activity_type: str) -> str:
        """Mendapatkan tipe parameter yang dibutuhkan untuk aktivitas."""
        return cls.PARAMETER_TYPE.get(activity_type.lower(), "distance")
    
    @classmethod
    def is_valid_activity(cls, activity_type: str) -> bool:
        """Mengecek apakah tipe aktivitas valid (ada di mapping)."""
        return activity_type.lower() in cls.ACTIVITY_MAPPING
    
    @classmethod
    def get_all_activities(cls) -> Dict[str, str]:
        """Mendapatkan semua mapping aktivitas yang tersedia."""
        return cls.ACTIVITY_MAPPING.copy()
    
    @classmethod
    def get_transport_activities(cls) -> Dict[str, str]:
        """Mendapatkan mapping khusus aktivitas transportasi."""
        return cls.TRANSPORT_MAPPING.copy()
    
    @classmethod
    def get_energy_activities(cls) -> Dict[str, str]:
        """Mendapatkan mapping khusus aktivitas energi."""
        return cls.ENERGY_MAPPING.copy()
