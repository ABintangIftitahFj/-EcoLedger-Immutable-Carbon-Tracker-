"""
=============================================================================
CLIMATIQ_SERVICE.PY - Layanan Integrasi API Climatiq
=============================================================================

File ini berisi layanan untuk berkomunikasi dengan Climatiq API,
platform yang menyediakan data emission factor untuk menghitung
jejak karbon dari berbagai aktivitas.

Tentang Climatiq:
-----------------
Climatiq adalah API yang menyediakan database emission factor dari
berbagai sumber terpercaya (EPA, BEIS, dll). Dengan Climatiq, kita
bisa menghitung berapa kg CO2 yang dihasilkan dari aktivitas seperti
berkendara, menggunakan listrik, dll.

Dokumentasi Climatiq: https://docs.climatiq.io/

Arsitektur Service:
-------------------
1. ClimatiqService: Class utama untuk interaksi dengan API
2. ClimatiqAPIError: Custom exception untuk error handling
3. climatiq_service: Instance global untuk digunakan di seluruh aplikasi

Semua method menggunakan async/await karena:
- HTTP request ke Climatiq bisa memakan waktu
- Async memungkinkan server melayani request lain sambil menunggu
- Optimal untuk FastAPI yang berbasis async

Author: EcoLedger Team
Version: 1.0.0
=============================================================================
"""

import httpx
import logging
from typing import Dict, Any, Optional
from config import settings
from activity_mapper import ActivityMapper

# Setup logger untuk modul ini
logger = logging.getLogger(__name__)


class ClimatiqAPIError(Exception):
    """
    Custom exception untuk error dari Climatiq API.
    
    Digunakan untuk membedakan error dari Climatiq dengan error lain.
    Ini memudahkan error handling di level endpoint (app.py).
    
    Penggunaan:
        try:
            result = await climatiq_service.estimate_emission(...)
        except ClimatiqAPIError as e:
            # Handle error spesifik Climatiq
            return {"error": str(e)}
    """
    pass


class ClimatiqService:
    """
    Layanan untuk berkomunikasi dengan Climatiq API.
    
    Class ini membungkus (wrap) semua interaksi dengan Climatiq API
    termasuk estimasi emisi, pencarian emission factor, dan batch
    processing.
    
    Attributes:
        api_key: Climatiq API key dari environment variable
        base_url: Base URL untuk Climatiq API v1
        headers: HTTP headers yang digunakan untuk semua request
    
    Penggunaan:
        # Import instance global
        from climatiq_service import climatiq_service
        
        # Hitung emisi
        result = await climatiq_service.estimate_emission(
            activity_type="car",
            distance_km=25.5
        )
        print(result["co2e"])  # Output: 4.87 (kg CO2)
    """
    
    def __init__(self):
        """
        Inisialisasi service dengan config dari environment.
        
        API key dan URL diambil dari settings agar bisa dikonfigurasi
        tanpa mengubah kode (environment-based configuration).
        """
        self.api_key = settings.climatiq_api_key
        self.base_url = settings.climatiq_api_url
        
        # Headers yang digunakan untuk semua request ke Climatiq
        self.headers = {
            # Bearer token untuk autentikasi
            "Authorization": f"Bearer {self.api_key}",
            # Content type JSON karena kita kirim/terima JSON
            "Content-Type": "application/json"
        }
    
    async def estimate_emission(
        self,
        activity_type: str,
        distance_km: Optional[float] = None,
        energy_kwh: Optional[float] = None,
        weight_kg: Optional[float] = None,
        money_spent: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        Menghitung emisi karbon menggunakan Climatiq API.
        
        Ini adalah method utama yang dipanggil saat user membuat
        aktivitas baru. Method ini:
        1. Mengkonversi activity_type ke Climatiq ID
        2. Menentukan parameter yang dibutuhkan
        3. Memanggil Climatiq API
        4. Mengembalikan hasil kalkulasi
        
        Args:
            activity_type: Tipe aktivitas user (contoh: 'car', 'motorbike')
            distance_km: Jarak dalam kilometer (untuk transportasi)
            energy_kwh: Energi dalam kWh (untuk listrik)
            weight_kg: Berat dalam kg (untuk limbah)
            money_spent: Uang dalam USD (untuk kalkulasi berbasis biaya)
        
        Returns:
            Dict dengan struktur:
            {
                "co2e": float,         # Total emisi dalam kg CO2e
                "co2e_unit": str,      # Satuan (biasanya "kg")
                "activity_id": str,    # Climatiq activity ID yang digunakan
                "emission_factor": {}, # Detail emission factor
                "parameters": {}       # Parameter yang digunakan
            }
        
        Raises:
            ClimatiqAPIError: Jika activity_type tidak valid, parameter
                              tidak lengkap, atau API call gagal
        
        Example:
            result = await service.estimate_emission(
                activity_type="car",
                distance_km=50
            )
            print(f"Emisi: {result['co2e']} kg CO2")
        """
        # =====================================================================
        # STEP 1: Konversi activity_type ke Climatiq ID
        # =====================================================================
        climatiq_id = ActivityMapper.get_climatiq_id(activity_type)
        
        if not climatiq_id:
            # Activity type tidak dikenal, raise error dengan pesan jelas
            raise ClimatiqAPIError(f"Tipe aktivitas tidak dikenal: {activity_type}")
        
        # =====================================================================
        # STEP 2: Tentukan parameter yang akan digunakan
        # =====================================================================
        # Setiap kategori aktivitas membutuhkan parameter berbeda
        
        param_type = ActivityMapper.get_parameter_type(activity_type)
        param_value = None
        param_unit = None
        
        # Pilih parameter berdasarkan tipe
        if param_type == "distance" and distance_km is not None:
            param_value = distance_km
            param_unit = "km"
        elif param_type == "energy" and energy_kwh is not None:
            param_value = energy_kwh
            param_unit = "kWh"
        elif param_type == "weight" and weight_kg is not None:
            param_value = weight_kg
            param_unit = "kg"
        elif param_type == "money" and money_spent is not None:
            param_value = money_spent
            param_unit = "usd"
        else:
            # Tidak ada parameter yang sesuai diisi
            raise ClimatiqAPIError(
                f"Parameter tidak lengkap untuk {activity_type}. "
                f"Butuh: {param_type}"
            )
        
        # =====================================================================
        # STEP 3: Siapkan payload request
        # =====================================================================
        payload = {
            "emission_factor": {
                # Activity ID yang akan digunakan untuk kalkulasi
                "activity_id": climatiq_id,
                # Data version: ^29 = gunakan versi 29.x (terbaru)
                "data_version": "^29"
            },
            "parameters": {
                # Contoh: {"distance": 50, "distance_unit": "km"}
                param_type: param_value,
                f"{param_type}_unit": param_unit
            }
        }
        
        # Log untuk monitoring dan debugging
        logger.info(f"Memanggil Climatiq API untuk {activity_type} dengan {param_value} {param_unit}")
        
        # =====================================================================
        # STEP 4: Kirim request ke Climatiq API
        # =====================================================================
        try:
            # Gunakan async HTTP client untuk non-blocking I/O
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.base_url}/estimate",  # Endpoint: /data/v1/estimate
                    headers=self.headers,
                    json=payload
                )
                
                # ============================================================
                # STEP 5: Proses response
                # ============================================================
                if response.status_code == 200:
                    # Sukses! Parse response JSON
                    data = response.json()
                    logger.info(f"Climatiq API sukses: {data.get('co2e')} kg CO2e")
                    
                    # Kembalikan data dalam format yang konsisten
                    return {
                        "co2e": data["co2e"],
                        "co2e_unit": data["co2e_unit"],
                        "activity_id": climatiq_id,
                        "emission_factor": data.get("emission_factor", {}),
                        "parameters": payload["parameters"]
                    }
                else:
                    # API mengembalikan error (4xx atau 5xx)
                    error_msg = f"Climatiq API error: {response.status_code} - {response.text}"
                    logger.error(error_msg)
                    raise ClimatiqAPIError(error_msg)
                    
        except httpx.TimeoutException:
            # Request timeout setelah 30 detik
            error_msg = "Request ke Climatiq API timeout"
            logger.error(error_msg)
            raise ClimatiqAPIError(error_msg)
            
        except httpx.RequestError as e:
            # Error jaringan lainnya (DNS, connection refused, dll)
            error_msg = f"Request ke Climatiq API gagal: {str(e)}"
            logger.error(error_msg)
            raise ClimatiqAPIError(error_msg)
    
    async def search_emission_factors(
        self,
        query: Optional[str] = None,
        category: Optional[str] = None,
        source: Optional[str] = None,
        region: Optional[str] = None,
        limit: int = 10
    ) -> Dict[str, Any]:
        """
        Mencari emission factor yang tersedia di database Climatiq.
        
        Berguna untuk:
        - Menemukan activity ID yang valid
        - Eksplorasi emission factor berdasarkan kategori/region
        - Debugging ketika estimasi gagal
        
        Args:
            query: Kata kunci pencarian (contoh: "car", "electricity")
            category: Filter berdasarkan kategori (contoh: "Vehicles")
            source: Filter berdasarkan sumber data (contoh: "EPA")
            region: Filter berdasarkan region (contoh: "US", "ID")
            limit: Jumlah maksimal hasil (default: 10)
        
        Returns:
            Dict dengan struktur response dari Climatiq search endpoint
        
        Raises:
            ClimatiqAPIError: Jika search gagal
        
        Example:
            results = await service.search_emission_factors(
                query="car",
                region="US",
                limit=5
            )
        """
        # Siapkan query parameters
        params = {
            # Data version wajib disertakan
            "data_version": "^29"
        }
        
        # Tambahkan filter opsional jika diisi
        if query:
            params["query"] = query
        if category:
            params["category"] = category
        if source:
            params["source"] = source
        if region:
            params["region"] = region
            
        # Limit jumlah hasil
        params["results_per_page"] = limit
        
        logger.info(f"Mencari emission factors di Climatiq dengan params: {params}")
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(
                    f"{self.base_url}/search",  # Endpoint: /data/v1/search
                    headers=self.headers,
                    params=params
                )
                
                if response.status_code == 200:
                    data = response.json()
                    logger.info(f"Ditemukan {len(data.get('results', []))} emission factors")
                    return data
                else:
                    error_msg = f"Pencarian Climatiq error: {response.status_code} - {response.text}"
                    logger.error(error_msg)
                    raise ClimatiqAPIError(error_msg)
                    
        except httpx.TimeoutException:
            error_msg = "Request pencarian Climatiq timeout"
            logger.error(error_msg)
            raise ClimatiqAPIError(error_msg)
            
        except httpx.RequestError as e:
            error_msg = f"Request pencarian Climatiq gagal: {str(e)}"
            logger.error(error_msg)
            raise ClimatiqAPIError(error_msg)
    
    async def batch_estimate(self, estimates: list) -> Dict[str, Any]:
        """
        Menghitung emisi untuk banyak aktivitas sekaligus (batch processing).
        
        Lebih efisien daripada memanggil estimate_emission satu per satu
        karena hanya butuh satu HTTP request untuk banyak kalkulasi.
        
        Args:
            estimates: List of estimate request objects
        
        Returns:
            Dict dengan hasil batch dari Climatiq
        
        Raises:
            ClimatiqAPIError: Jika batch request gagal
        """
        payload = {"estimates": estimates}
        
        logger.info(f"Memanggil Climatiq batch estimate dengan {len(estimates)} item")
        
        try:
            # Timeout lebih lama untuk batch processing
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    f"{self.base_url}/batch",
                    headers=self.headers,
                    json=payload
                )
                
                if response.status_code == 200:
                    data = response.json()
                    logger.info(f"Batch estimate sukses: {len(data.get('results', []))} results")
                    return data
                else:
                    error_msg = f"Climatiq batch error: {response.status_code} - {response.text}"
                    logger.error(error_msg)
                    raise ClimatiqAPIError(error_msg)
                    
        except httpx.TimeoutException:
            error_msg = "Request batch Climatiq timeout"
            logger.error(error_msg)
            raise ClimatiqAPIError(error_msg)
            
        except httpx.RequestError as e:
            error_msg = f"Request batch Climatiq gagal: {str(e)}"
            logger.error(error_msg)
            raise ClimatiqAPIError(error_msg)


# =============================================================================
# GLOBAL SERVICE INSTANCE
# =============================================================================
# Instance tunggal yang digunakan di seluruh aplikasi.
# Import dengan: from climatiq_service import climatiq_service

climatiq_service = ClimatiqService()
