"""
=============================================================================
CLIMATE TRACE SERVICE
=============================================================================
Service untuk mengambil data emisi global dari Climate TRACE API.

Climate TRACE menyediakan data emisi aktual dari:
- Fasilitas (pabrik, pembangkit listrik, tambang)
- Negara
- Sektor industri

Base URL: https://api.climatetrace.org
"""

import httpx
from typing import List, Dict, Optional, Any
import logging
from functools import lru_cache
from datetime import datetime, timezone, timedelta

# Timezone WIB (UTC+7)
WIB = timezone(timedelta(hours=7))

logger = logging.getLogger(__name__)

CLIMATE_TRACE_BASE_URL = "https://api.climatetrace.org"


class ClimateTraceService:
    """Service untuk mengakses Climate TRACE API."""
    
    def __init__(self):
        self.base_url = CLIMATE_TRACE_BASE_URL
        self.timeout = 30.0
    
    async def _request(self, endpoint: str, params: Dict = None) -> Any:
        """Make async request to Climate TRACE API."""
        url = f"{self.base_url}{endpoint}"
        
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(url, params=params)
                response.raise_for_status()
                return response.json()
        except httpx.HTTPStatusError as e:
            logger.error(f"Climate TRACE API error: {e.response.status_code}")
            raise
        except Exception as e:
            logger.error(f"Climate TRACE request failed: {e}")
            raise
    
    # =========================================================================
    # DEFINITIONS
    # =========================================================================
    
    async def get_countries(self) -> List[Dict]:
        """Get list of all countries."""
        return await self._request("/v7/definitions/countries")
    
    async def get_sectors(self) -> List[str]:
        """Get list of all sectors."""
        return await self._request("/v7/definitions/sectors")
    
    async def get_subsectors(self) -> List[str]:
        """Get list of all subsectors."""
        return await self._request("/v7/definitions/subsectors")
    
    async def get_gases(self) -> List[str]:
        """Get list of available gases."""
        return await self._request("/v7/definitions/gases")
    
    async def get_continents(self) -> List[str]:
        """Get list of continents."""
        return await self._request("/v7/definitions/continents")
    
    # =========================================================================
    # RANKINGS
    # =========================================================================
    
    async def get_country_rankings(
        self,
        gas: str = "co2e_100yr",
        start: str = None,
        end: str = None,
        sectors: List[str] = None,
        continent: str = None
    ) -> Dict:
        """
        Get country rankings by emissions.
        
        Args:
            gas: Gas type (co2, ch4, n2o, co2e_100yr, co2e_20yr)
            start: Start date (e.g., "2024-01-01" or "2024")
            end: End date (e.g., "2024-12-31" or "2024")
            sectors: List of sectors to filter
            continent: Continent name to filter
        
        Returns:
            Country rankings with emissions data
        """
        current_year = datetime.now(WIB).year
        
        params = {
            "gas": gas,
            "start": start or f"{current_year - 1}",
            "end": end or f"{current_year - 1}"
        }
        
        if sectors:
            params["sectors"] = ",".join(sectors)
        if continent:
            params["continent"] = continent
        
        return await self._request("/v7/rankings/countries", params)
    
    # =========================================================================
    # EMISSION SOURCES (Top Polluters)
    # =========================================================================
    
    async def get_sources(
        self,
        year: int = None,
        gas: str = "co2e_100yr",
        sectors: List[str] = None,
        subsectors: List[str] = None,
        country: str = None,  # ISO3 code, e.g., "IDN" for Indonesia
        limit: int = 100,
        offset: int = 0
    ) -> List[Dict]:
        """
        Get emission sources (facilities/assets) ranked by emissions.
        
        Args:
            year: Emissions year (2021+)
            gas: Gas type
            sectors: List of sectors
            subsectors: List of subsectors
            country: ISO3 country code (e.g., "IDN" for Indonesia)
            limit: Max results
            offset: Pagination offset
        
        Returns:
            List of emission sources
        """
        current_year = datetime.now(WIB).year
        
        params = {
            "year": year or current_year - 1,
            "gas": gas,
            "limit": limit,
            "offset": offset
        }
        
        if sectors:
            params["sectors"] = ",".join(sectors)
        if subsectors:
            params["subsectors"] = ",".join(subsectors)
        if country:
            # Use gadmId for country filtering
            params["gadmId"] = country
        
        return await self._request("/v7/sources", params)
    
    async def get_source_details(
        self,
        source_id: int,
        gas: str = "co2e_100yr",
        start: str = None,
        end: str = None
    ) -> Dict:
        """
        Get details of a specific emission source.
        
        Args:
            source_id: Climate TRACE source ID
            gas: Gas type
            start: Start date
            end: End date
        
        Returns:
            Source details with emissions timeseries
        """
        current_year = datetime.now(WIB).year
        
        params = {
            "gas": gas,
            "start": start or f"{current_year - 3}",
            "end": end or f"{current_year - 1}"
        }
        
        return await self._request(f"/v7/sources/{source_id}", params)
    
    # =========================================================================
    # AGGREGATED EMISSIONS
    # =========================================================================
    
    async def get_aggregated_emissions(
        self,
        country: str = None,
        continent: str = None,
        gas: str = "co2e_100yr",
        start: str = None,
        end: str = None,
        sectors: List[str] = None
    ) -> Dict:
        """
        Get aggregated emissions by location.
        
        Args:
            country: ISO3 country code
            continent: Continent name
            gas: Gas type
            start: Start date
            end: End date
            sectors: List of sectors
        
        Returns:
            Aggregated emissions data
        """
        current_year = datetime.now(WIB).year
        
        params = {
            "gas": gas,
            "start": start or f"{current_year - 1}",
            "end": end or f"{current_year - 1}"
        }
        
        if country:
            params["country"] = country
        if continent:
            params["continent"] = continent
        if sectors:
            params["sectors"] = ",".join(sectors)
        
        return await self._request("/v7/emissions", params)
    
    # =========================================================================
    # CITIES
    # =========================================================================
    
    async def search_cities(
        self,
        name: str = None,
        country: str = None,
        limit: int = 50
    ) -> List[Dict]:
        """
        Search cities/urban areas.
        
        Args:
            name: City name (partial match)
            country: ISO3 country code
            limit: Max results
        
        Returns:
            List of cities
        """
        params = {"limit": limit}
        
        if name:
            params["name"] = name
        if country:
            params["country"] = country
        
        return await self._request("/v7/cities", params)
    
    # =========================================================================
    # OWNERS (Company Search)
    # =========================================================================
    
    async def search_owners(
        self,
        name: str,
        limit: int = 50
    ) -> List[Dict]:
        """
        Search emission source owners (companies).
        
        Args:
            name: Owner/company name (partial match)
            limit: Max results
        
        Returns:
            List of owners
        """
        params = {
            "name": name,
            "limit": limit
        }
        
        return await self._request("/v7/owners", params)


# Global instance
climate_trace_service = ClimateTraceService()
