"""
=============================================================================
CASSANDRA AUDIT LOG SERVICE
=============================================================================
Service untuk mencatat dan mengambil audit log dari Cassandra.

Digunakan untuk:
- FR-11: System Audit Log
- FR-12: View Audit Trail (Admin)

Keyspace: eco_logs
Table: activity_audit
"""

import uuid
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Optional
import logging

# Timezone WIB (UTC+7)
WIB = timezone(timedelta(hours=7))

logger = logging.getLogger(__name__)

# Global session variable
_cassandra_session = None


def get_cassandra_session():
    """Get or create Cassandra session."""
    global _cassandra_session
    
    if _cassandra_session is None:
        try:
            from cassandra.cluster import Cluster
            from cassandra.auth import PlainTextAuthProvider
            import os
            
            cassandra_host = os.environ.get("CASSANDRA_HOST", "cassandra")
            cassandra_port = int(os.environ.get("CASSANDRA_PORT", "9042"))
            
            cluster = Cluster([cassandra_host], port=cassandra_port)
            _cassandra_session = cluster.connect('eco_logs')
            logger.info(f"Connected to Cassandra at {cassandra_host}:{cassandra_port}")
        except Exception as e:
            logger.error(f"Failed to connect to Cassandra: {e}")
            return None
    
    return _cassandra_session


def log_audit(
    user_id: str,
    action_type: str,
    entity: str,
    entity_id: str = "",
    changes: Dict[str, str] = None,
    ip_address: str = "",
    description: str = ""
) -> bool:
    """
    Mencatat audit log ke Cassandra.
    
    Args:
        user_id: ID pengguna yang melakukan aksi
        action_type: Jenis aksi (LOGIN, LOGOUT, CREATE, UPDATE, DELETE, VERIFY)
        entity: Entitas yang diakses (activity, user, hash_chain)
        entity_id: ID entitas
        changes: Detail perubahan dalam format dict
        ip_address: IP address user
        description: Deskripsi aksi
    
    Returns:
        True jika berhasil, False jika gagal
    """
    try:
        session = get_cassandra_session()
        if session is None:
            logger.warning("Cassandra not available, skipping audit log")
            return False
        
        audit_id = uuid.uuid4()
        activity_time = datetime.now(WIB)
        
        # Prepare changes map
        changes_map = changes or {}
        
        query = """
        INSERT INTO activity_audit 
        (user_id, activity_time, audit_id, action_type, entity, entity_id, changes, ip_address, description)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        
        session.execute(query, (
            user_id,
            activity_time,
            audit_id,
            action_type,
            entity,
            entity_id,
            changes_map,
            ip_address,
            description
        ))
        
        logger.debug(f"Audit logged: {action_type} {entity} by {user_id}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to log audit: {e}")
        return False


def get_audit_logs(
    user_id: Optional[str] = None,
    limit: int = 100
) -> List[Dict]:
    """
    Mengambil audit logs dari Cassandra.
    
    Args:
        user_id: Filter by user_id (optional)
        limit: Jumlah maksimal record
    
    Returns:
        List of audit log records
    """
    try:
        session = get_cassandra_session()
        if session is None:
            logger.warning("Cassandra not available")
            return []
        
        if user_id:
            query = f"""
            SELECT user_id, activity_time, audit_id, action_type, entity, entity_id, 
                   changes, ip_address, description 
            FROM activity_audit 
            WHERE user_id = %s
            LIMIT {limit}
            """
            rows = session.execute(query, (user_id,))
        else:
            # Note: In production, you'd need a secondary table or allow filtering
            query = f"""
            SELECT user_id, activity_time, audit_id, action_type, entity, entity_id, 
                   changes, ip_address, description 
            FROM activity_audit 
            LIMIT {limit}
            ALLOW FILTERING
            """
            rows = session.execute(query)
        
        results = []
        for row in rows:
            # Convert UTC timestamp to WIB
            activity_time_wib = None
            if row.activity_time:
                # Cassandra returns timezone-aware datetime in UTC
                # Convert to WIB by replacing timezone
                if row.activity_time.tzinfo is None:
                    # If somehow no timezone, assume UTC
                    from datetime import timezone as tz
                    activity_time_utc = row.activity_time.replace(tzinfo=tz.utc)
                else:
                    activity_time_utc = row.activity_time
                # Convert to WIB
                activity_time_wib = activity_time_utc.astimezone(WIB).isoformat()
            
            results.append({
                "user_id": row.user_id,
                "activity_time": activity_time_wib,
                "audit_id": str(row.audit_id),
                "action_type": row.action_type,
                "entity": row.entity,
                "entity_id": row.entity_id,
                "changes": dict(row.changes) if row.changes else {},
                "ip_address": row.ip_address,
                "description": row.description
            })
        
        return results
        
    except Exception as e:
        logger.error(f"Failed to get audit logs: {e}")
        return []


def get_audit_stats() -> Dict:
    """
    Mendapatkan statistik audit logs.
    
    Returns:
        Dict dengan statistik
    """
    try:
        session = get_cassandra_session()
        if session is None:
            return {"total": 0, "error": "Cassandra not available"}
        
        # Count total (approximate in Cassandra)
        query = "SELECT COUNT(*) FROM activity_audit"
        result = session.execute(query)
        total = result.one()[0]
        
        return {
            "total": total,
            "status": "connected"
        }
        
    except Exception as e:
        logger.error(f"Failed to get audit stats: {e}")
        return {"total": 0, "error": str(e)}
