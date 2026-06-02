from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class MemberBase(BaseModel):
    id_normalized: int
    profile_member_id: str
    member_name: str
    email: str
    address: str
    gender: str
    next_plan_of_action: Optional[str]
    nearest_hospital: Optional[str]
    measure: str
    compliant: str
    follow_up: str
    priority: str

class Member360(MemberBase):
    measure_description: Optional[str]
    data_elements: Optional[str]
    gap_closure: Optional[str]
    income: Optional[str]
    transportation_access: Optional[str]
    primary_language: Optional[str]
    mobility_status: Optional[str]
    housing_status: Optional[str]
    provider_access: Optional[str]
    last_claim_date: Optional[datetime]

class EmailGenerateRequest(BaseModel):
    member_id: int

class EmailSendRequest(BaseModel):
    member_id: int
    content: str
    language: str

class SmsSendRequest(BaseModel):
    member_id: int
    content: str
    language: str

class BulkOutreachRequest(BaseModel):
    member_ids: List[int]
