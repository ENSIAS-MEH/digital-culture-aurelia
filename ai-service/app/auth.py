from fastapi import HTTPException, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from app.config import settings

_bearer = HTTPBearer()


def _jwt_key() -> bytes:
    """Match Java's key derivation: UTF-8 bytes of secret, truncated/padded to 32 bytes."""
    raw = settings.jwt_secret.encode("utf-8")
    key = bytearray(32)
    key[: min(len(raw), 32)] = raw[: min(len(raw), 32)]
    return bytes(key)


def verify_token(credentials: HTTPAuthorizationCredentials = Security(_bearer)) -> dict:
    try:
        payload = jwt.decode(
            credentials.credentials,
            _jwt_key(),
            algorithms=[settings.jwt_algorithm],
        )
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
        return {"user_id": user_id, "email": payload.get("email")}
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")
