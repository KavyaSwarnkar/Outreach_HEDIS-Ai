import hashlib
import os
import uuid
from datetime import datetime, timedelta
from typing import Optional

from database import get_db


def _hash_password(password: str, salt: Optional[bytes] = None):
    if salt is None:
        salt = os.urandom(16)
    pwd_hash = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 100_000)
    return salt.hex(), pwd_hash.hex()


def create_user(email: str, name: str, password: str):
    conn = get_db()
    cur = conn.cursor()
    res = cur.execute("SELECT id FROM users WHERE email = ?", [email]).fetchall()
    if res:
        return None

    salt_hex, hash_hex = _hash_password(password)
    cur.execute(
        "INSERT INTO users (email, name, password_hash, salt) VALUES (?, ?, ?, ?)",
        [email, name, hash_hex, salt_hex],
    )
    conn.commit()
    user = cur.execute("SELECT id, email, name FROM users WHERE email = ?", [email]).fetchall()
    if user:
        uid, uemail, uname = user[0]
        return {"id": uid, "email": uemail, "name": uname}
    return None


def verify_user(email: str, password: str):
    conn = get_db()
    cur = conn.cursor()
    row = cur.execute("SELECT id, email, name, password_hash, salt FROM users WHERE email = ?", [email]).fetchall()
    if not row:
        return None
    uid, uemail, uname, pwd_hash, salt_hex = row[0]
    salt = bytes.fromhex(salt_hex)
    _, test_hash = _hash_password(password, salt)
    if test_hash == pwd_hash:
        return {"id": uid, "email": uemail, "name": uname}
    return None


def create_session(user_id: int, expires_seconds: int = 7 * 24 * 3600):
    conn = get_db()
    cur = conn.cursor()
    token = uuid.uuid4().hex
    expires_at = datetime.utcnow() + timedelta(seconds=expires_seconds)
    cur.execute(
        "INSERT INTO sessions (user_id, session_token, expires_at) VALUES (?, ?, ?)",
        [user_id, token, expires_at],
    )
    conn.commit()
    return token


def get_user_by_session(token: str):
    conn = get_db()
    cur = conn.cursor()
    now = datetime.utcnow()
    row = cur.execute(
        "SELECT u.id, u.email, u.name FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.session_token = ? AND s.expires_at > ?",
        [token, now],
    ).fetchall()
    if not row:
        return None
    uid, email, name = row[0]
    return {"id": uid, "email": email, "name": name}


def delete_session(token: str):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("DELETE FROM sessions WHERE session_token = ?", [token])
    conn.commit()
    return True

