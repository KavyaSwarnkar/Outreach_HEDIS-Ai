from fastapi import APIRouter, HTTPException, Response, Request
from pydantic import BaseModel
from services import auth_service

router = APIRouter()


class LoginRequest(BaseModel):
    email: str
    password: str


class LoginResponse(BaseModel):
    email: str
    name: str
    session_token: str


class SignupRequest(BaseModel):
    email: str
    name: str
    password: str


@router.post("/signup")
def signup(req: SignupRequest):
    created = auth_service.create_user(req.email, req.name, req.password)
    if not created:
        raise HTTPException(status_code=400, detail="User already exists")
    return {"ok": True}


@router.post("/login", response_model=LoginResponse)
def login(req: LoginRequest, response: Response):
    user = auth_service.verify_user(req.email, req.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = auth_service.create_session(user["id"])
    # set httpOnly cookie
    response.set_cookie("hedis_session", token, httponly=True, samesite="lax", max_age=7*24*3600)
    # also return the token in response JSON as a fallback for local dev
    return {"email": user["email"], "name": user["name"], "session_token": token}


@router.post("/logout")
def logout(response: Response, request: Request):
    token = request.cookies.get("hedis_session")
    if token:
        auth_service.delete_session(token)
    response.delete_cookie("hedis_session")
    return {"ok": True}


@router.get("/me")
def me(request: Request):
    token = request.cookies.get("hedis_session")
    source = "cookie"
    # fallback: check Authorization header
    if not token:
        auth = request.headers.get("authorization")
        if auth and auth.lower().startswith("bearer "):
            token = auth.split(" ", 1)[1]
            source = "authorization"

    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    user = auth_service.get_user_by_session(token)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return {"email": user["email"], "name": user["name"]}
