from fastapi import APIRouter, HTTPException, Query
from database import get_db
from models.schemas import MemberBase, Member360
from typing import List, Optional

router = APIRouter()

@router.get("/", response_model=dict)
def get_members(
    search: Optional[str] = None,
    measure: Optional[str] = None,
    compliant: Optional[str] = None,
    language: Optional[str] = None,
    language_not_english: Optional[str] = None,
    follow_up: Optional[str] = None,
    housing: Optional[str] = None,
    transportation: Optional[str] = None,
    page: int = 1,
    limit: int = 50
):
    conn = get_db()
    query = "SELECT * FROM patient_360 WHERE 1=1"
    params = []
    
    if search:
        query += " AND (profile_member_id ILIKE ? OR member_name ILIKE ?)"
        params.extend([f"%{search}%", f"%{search}%"])
        
    if measure:
        query += " AND measure = ?"
        params.append(measure)
    if compliant:
        query += " AND compliant = ?"
        params.append(compliant)
    if language:
        query += " AND primary_language = ?"
        params.append(language)
    if language_not_english == 'true':
        query += " AND primary_language != 'English'"
    if follow_up:
        query += " AND follow_up = ?"
        params.append(follow_up)
    if housing:
        query += " AND housing_status = ?"
        params.append(housing)
    if transportation:
        query += " AND transportation_access = ?"
        params.append(transportation)
        
    # Count total
    count_query = f"SELECT COUNT(*) FROM ({query})"
    total = conn.execute(count_query, params).fetchone()[0]
    
    # Pagination
    offset = (page - 1) * limit
    query += " ORDER BY id_normalized ASC LIMIT ? OFFSET ?"
    params.extend([limit, offset])
    
    df = conn.execute(query, params).df()
    
    # Convert dates to string to avoid JSON serialization issues with NaT/NaN
    df = df.where(df.notnull(), None) 
    
    members = df.to_dict(orient="records")
    
    return {
        "total": total,
        "page": page,
        "limit": limit,
        "data": members
    }

@router.get("/{member_id}", response_model=dict)
def get_member(member_id: int):
    conn = get_db()
    result = conn.execute("SELECT * FROM patient_360 WHERE id_normalized = ?", [member_id]).df()
    if result.empty:
        raise HTTPException(status_code=404, detail="Member not found")
        
    result = result.where(result.notnull(), None)
    member_data = result.to_dict(orient="records")[0]
    
    return member_data
