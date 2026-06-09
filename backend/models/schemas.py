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

    screening_risk_score: Optional[float] = None
    screening_days_overdue: Optional[int] = None
    screening_notes: Optional[str] = None
    age: Optional[int] = None
    line_of_business: Optional[str] = None
    eligible_for_bcs: Optional[str] = None
    gap_status: Optional[str] = None
    gap_detected_date: Optional[str] = None
    gap_due_date: Optional[str] = None
    family_history_breast_cancer: Optional[str] = None
    comorbidity_count: Optional[int] = None
    pcp_assigned: Optional[str] = None
    upcoming_pcp_visit_date: Optional[str] = None
    preferred_channel: Optional[str] = None
    digital_engaged: Optional[str] = None
    prior_outreach_attempts: Optional[int] = None
    last_outreach_channel: Optional[str] = None
    prior_response: Optional[str] = None
    sdoh_transport_barrier: Optional[str] = None
    sdoh_financial_barrier: Optional[str] = None
    sdoh_health_literacy_barrier: Optional[str] = None
    rural_flag: Optional[str] = None
    nearest_screening_distance: Optional[float] = None
    screening_opt_out_flag: Optional[str] = None
    provider_alert: Optional[str] = None

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
