"""
=============================================================================
AUTH.PY - Sistem Autentikasi JWT untuk EcoLedger
=============================================================================

File ini mengimplementasikan:
1. Password hashing menggunakan bcrypt
2. JWT token generation dan validation
3. FastAPI dependencies untuk protected routes
4. Role-based access control (admin/user)

Author: EcoLedger Team
Version: 1.0.0
=============================================================================
"""

from datetime import datetime, timedelta
from typing import Optional, Union
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from pydantic import BaseModel
from config import settings
from database import get_db
import logging

logger = logging.getLogger(__name__)

# =============================================================================
# PASSWORD HASHING
# =============================================================================
# Menggunakan bcrypt untuk hashing password secara aman

import bcrypt


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifikasi password plain text dengan hash."""
    password_bytes = plain_password.encode('utf-8')
    hash_bytes = hashed_password.encode('utf-8')
    return bcrypt.checkpw(password_bytes, hash_bytes)


def get_password_hash(password: str) -> str:
    """
    Hash password menggunakan bcrypt.
    
    Bcrypt akan otomatis menghandle password panjang.
    """
    password_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')


# =============================================================================
# JWT TOKEN
# =============================================================================
# JWT untuk autentikasi stateless

# Konfigurasi JWT
SECRET_KEY = settings.secret_key
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = settings.jwt_expiration_hours or 24

# Security scheme untuk Swagger UI
security = HTTPBearer()


class TokenData(BaseModel):
    """Data yang disimpan dalam JWT token."""
    user_id: str
    email: str
    role: str
    exp: Optional[datetime] = None


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Membuat JWT access token.
    
    Args:
        data: Dictionary berisi data user (user_id, email, role)
        expires_delta: Masa berlaku token (default 24 jam)
    
    Returns:
        str: Encoded JWT token
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    
    to_encode.update({"exp": expire})
    
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> Optional[TokenData]:
    """
    Decode dan validasi JWT token.
    
    Args:
        token: JWT token string
    
    Returns:
        TokenData jika valid, None jika tidak valid
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("user_id")
        email: str = payload.get("email")
        role: str = payload.get("role")
        
        if user_id is None or email is None:
            return None
        
        return TokenData(user_id=user_id, email=email, role=role)
    except JWTError as e:
        logger.warning(f"JWT decode error: {e}")
        return None


# =============================================================================
# FASTAPI DEPENDENCIES
# =============================================================================
# Dependencies untuk melindungi routes

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> TokenData:
    """
    Dependency untuk mendapatkan user yang sedang login.
    
    Digunakan untuk protected routes.
    
    Raises:
        HTTPException 401: Jika token tidak valid
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token tidak valid atau sudah expired",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    token = credentials.credentials
    token_data = decode_access_token(token)
    
    if token_data is None:
        raise credentials_exception
    
    return token_data


async def get_current_active_user(
    current_user: TokenData = Depends(get_current_user)
) -> TokenData:
    """
    Dependency untuk mendapatkan user aktif.
    
    Bisa ditambahkan pengecekan apakah user sudah dinonaktifkan, dll.
    """
    # Di sini bisa ditambahkan pengecekan ke database
    # apakah user masih aktif atau sudah di-ban
    return current_user


def require_role(required_role: str):
    """
    Factory function untuk membuat dependency yang memerlukan role tertentu.
    
    Usage:
        @app.get("/admin-only")
        async def admin_route(user: TokenData = Depends(require_role("admin"))):
            pass
    
    Args:
        required_role: Role yang diperlukan ("admin" atau "user")
    
    Returns:
        Dependency function
    """
    async def role_checker(
        current_user: TokenData = Depends(get_current_user)
    ) -> TokenData:
        if current_user.role != required_role and current_user.role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Akses ditolak. Memerlukan role: {required_role}"
            )
        return current_user
    
    return role_checker


# Shortcut dependencies
require_admin = require_role("admin")
require_user = require_role("user")


async def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(
        HTTPBearer(auto_error=False)
    )
) -> Optional[TokenData]:
    """
    Dependency opsional untuk routes yang tidak wajib login.
    
    Mengembalikan user data jika ada token valid, None jika tidak.
    Berguna untuk routes yang berbeda behavior untuk guest vs logged in user.
    """
    if credentials is None:
        return None
    
    token_data = decode_access_token(credentials.credentials)
    return token_data
