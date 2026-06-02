from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import init_db
from routers import dashboard, members, outreach, auth

app = FastAPI(title="HEDIS Outreach Dashboard API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3005",
        "http://127.0.0.1:3005",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    # Initialize DuckDB and load Excel data
    init_db()
    print("Database initialized successfully.")

# Include Routers
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(members.router, prefix="/api/members", tags=["Members"])
app.include_router(outreach.router, prefix="/api/outreach", tags=["Outreach"])
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])

@app.get("/")
def read_root():
    return {"status": "API is running"}
