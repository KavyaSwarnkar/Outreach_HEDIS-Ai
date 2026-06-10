from fastapi import APIRouter, HTTPException
from database import get_db
from models.schemas import EmailGenerateRequest, EmailSendRequest, SmsSendRequest, BulkOutreachRequest
from services.email_service import send_real_email
import os
import re
from datetime import datetime, timedelta

def summarize(text: str, fallback: str = "(no preview)"):
    if not text:
        return fallback
    # Strip HTML tags (including attributes, newlines, multiple spaces)
    plain = re.sub(r'<[^>]*>', '', text)
    plain = re.sub(r'\s+', ' ', plain).strip()
    plain = ' '.join(plain.split())
    return (plain[:180] + '...') if len(plain) > 180 else plain

router = APIRouter()

def render_template(template_name: str, context: dict) -> str:
    template_path = os.path.join(os.path.dirname(__file__), "..", "templates", template_name)
    with open(template_path, "r", encoding="utf-8") as f:
        html = f.read()
    for key, value in context.items():
        html = html.replace(f"{{{{ {key} }}}}", str(value))
    return html

@router.post("/send-member-reminder/{id_normalized}")
def send_member_reminder(id_normalized: int):
    conn = get_db()
    
    member = conn.execute("SELECT * FROM patient_360 WHERE id_normalized = ?", [id_normalized]).df()
    if member.empty:
        raise HTTPException(status_code=404, detail="Member context path not found")
        
    member_data = member.to_dict(orient="records")[0]
    
    # Determine remaining_days (lower bound of the expected range) based on measure code
    measure_code = (member_data.get("measure") or "").upper()
    if measure_code == 'COL':
        remaining_days = "10-15"
    elif measure_code == 'OMW':
        remaining_days = "3-5"
    elif measure_code == 'SPC':
        remaining_days = "25-30"
    else:
        remaining_days = "TBD"

    context_data = {
        "member_name": member_data.get("member_name", "Valued Member"),
        "measure_description": member_data.get("measure_description", "Preventive Health Visit"),
        "measure_code": member_data.get("measure", "HEDIS-GAP"),
        "gap_closure_action": member_data.get("gap_closure", "Consult with your Primary Care Provider."),
        "remaining_days": remaining_days,
        "care_gaps": member_data.get("care_gaps", "1"),
        "upcoming_appointment": member_data.get("appointment_date") is not None,
        "appointment_datetime": f"{member_data.get('appointment_date', '')} at {member_data.get('appointment_time', '')}" if member_data.get('appointment_date') else "",
        "appointment_location": member_data.get("appointment_location", "")
    }
    
    # Render string structure 
    html_body = render_template("care_gap_reminder.html", context_data)
    
    # Send HTML payload over verified SMTP channel
    success = send_real_email(
        to_email=member_data.get("email"),
        subject=f"Important Health Reminder: Outstanding Care Action Needed",
        html_content=html_body
    )
    
    if success:
        return {"status": "success", "message": f"HTML template delivered to {member_data.get('email')}"}
    else:
        return {"status": "error", "message": "Failed to send mailing template layers."}
@router.post("/generate-email")
def generate_email(req: EmailGenerateRequest):
    conn = get_db()
    result = conn.execute("SELECT * FROM patient_360 WHERE id_normalized = ?", [req.member_id]).df()
    if result.empty:
        raise HTTPException(status_code=404, detail="Member not found")
        
    result = result.where(result.notnull(), None)
    member_data = result.to_dict(orient="records")[0]
    
    # Compute remaining_days and actual due date based on measure code
    measure_code = (member_data.get("measure") or "").upper()
    if measure_code == 'COL':
        remaining_days = "10"
        days_to_add = 10
    elif measure_code == 'OMW':
        remaining_days = "3"
        days_to_add = 3
    elif measure_code == 'SPC':
        remaining_days = "25"
        days_to_add = 25
    else:
        remaining_days = "TBD"
        days_to_add = 14 # default fallback
        
    # Calculate the target due date
    calculated_due_date = (datetime.now() + timedelta(days=days_to_add)).strftime("%B %d, %Y")
    if measure_code == "BCS":
        appointment_date = member_data.get("upcoming_pcp_visit_date")
    else:
        appointment_date = calculated_due_date
    context_data = {
        "member_name": member_data.get("member_name", "Valued Member"),
        "measure_description": member_data.get("measure_description", "Preventive Health Visit"),
        "measure_code": member_data.get("measure", "HEDIS-GAP"),
        "gap_closure_action": member_data.get("gap_closure", "Consult with your Primary Care Provider."),
        "remaining_days": remaining_days,
        "due_date": appointment_date,
        "care_gaps": member_data.get("care_gaps", "1"),
        "upcoming_appointment": member_data.get("appointment_date") is not None,
        
        "appointment_datetime": f"{member_data.get('appointment_date', '')} at {member_data.get('appointment_time', '')}" if member_data.get('appointment_date') else "",
        "appointment_location": member_data.get("nearest_hospital", "Location not found")
    }
    patient_lang = member_data.get("primary_language", "English").strip().lower()
    if patient_lang == "spanish":
        template_file = "care_gap_reminder_es.html"
    elif patient_lang == "german":
        template_file = "care_gap_reminder_de.html"
    elif patient_lang == "french":
        template_file = "care_gap_reminder_fr.html"
    elif patient_lang == "arabic":
        template_file = "care_gap_reminder_ar.html"
    elif patient_lang == "chinese":
        template_file = "care_gap_reminder_zh.html"
    else:
        template_file = "care_gap_reminder.html"
    
    email_content = render_template(template_file, context_data)
    return {"content": email_content, "language": member_data.get("primary_language", "English")}

@router.post("/send-email")
def send_email(req: EmailSendRequest):
    conn = get_db()

    # Fetch real email address
    res = conn.execute("SELECT email, member_name, profile_member_id FROM patient_360 WHERE id_normalized = ? LIMIT 1", [req.member_id]).fetchone()
    if res and res[0]:
        subject = f"Important Update Regarding Your Care - {res[1]}"
        send_real_email(res[0], subject, req.content)

    profile_id = res[2] if res else f"M{str(req.member_id).zfill(3)}"
    member_name = res[1] if res else "Member"
    conn.execute("DELETE FROM outreach_log WHERE member_id = ? AND status = 'Draft'", [profile_id])
    # Store descriptive message instead of subject
    log_message = f"Sent mail to {member_name}"
    conn.execute("""
        INSERT INTO outreach_log (member_id, channel, language, content, status)
        VALUES (?, 'Email', ?, ?, 'Sent')
    """, [profile_id, req.language, log_message])
    return {"status": "success", "message": "Email sent successfully"}

@router.post("/send-sms")
def send_sms(req: SmsSendRequest):
    conn = get_db()
    res = conn.execute("SELECT profile_member_id FROM patient_360 WHERE id_normalized = ? LIMIT 1", [req.member_id]).fetchone()
    profile_id = res[0] if res else f"M{str(req.member_id).zfill(3)}"
    
    conn.execute("""
        INSERT INTO outreach_log (member_id, channel, language, content, status)
        VALUES (?, 'SMS', ?, ?, 'Sent')
    """, [profile_id, req.language, req.content])
    
    return {"status": "success", "message": "SMS sent successfully"}

@router.get("/log")
def get_outreach_log():
    conn = get_db()
    logs = conn.execute("SELECT * FROM outreach_log ORDER BY created_at DESC").df()
    logs = logs.where(logs.notnull(), None)
    return logs.to_dict(orient="records")


@router.post("/log/sanitize")
def sanitize_outreach_log():
    """Sanitize existing outreach_log rows by stripping HTML and replacing content with a short preview.
    Use this to clean up previously stored full HTML templates.
    """
    conn = get_db()
    df = conn.execute("SELECT id, content FROM outreach_log").df()
    if df.empty:
        return {"status": "success", "message": "No log entries to sanitize."}

    updated = 0
    for row in df.to_dict(orient="records"):
        cid = row.get("id")
        content = row.get("content") or ""
        # if content looks like HTML, summarize and update
        if '<' in content and '>' in content:
            preview = summarize(content, "(sanitized)")
            conn.execute("UPDATE outreach_log SET content = ? WHERE id = ?", [preview, cid])
            updated += 1

    return {"status": "success", "sanitized": updated}

@router.delete("/log/clear")
def clear_outreach_log():
    conn = get_db()
    conn.execute("DELETE FROM outreach_log")
    return {"status": "success", "message": "Log cleared"}

@router.get("/analytics")
def get_outreach_analytics():
    conn = get_db()
    analytics = conn.execute("SELECT * FROM outreach_analytics ORDER BY sort_order ASC").df()
    analytics = analytics.where(analytics.notnull(), None)
    return analytics.to_dict(orient="records")

@router.post("/log/draft")
def save_draft(req: EmailSendRequest):
    conn = get_db()
    res = conn.execute("SELECT profile_member_id FROM patient_360 WHERE id_normalized = ? LIMIT 1", [req.member_id]).fetchone()
    profile_id = res[0] if res else f"M{str(req.member_id).zfill(3)}"
    
    conn.execute("DELETE FROM outreach_log WHERE member_id = ? AND status = 'Draft'", [profile_id])
    
    # Store the full template content so draft can be reopened and sent later
    conn.execute("""
        INSERT INTO outreach_log (member_id, channel, language, content, status)
        VALUES (?, 'Email', ?, ?, 'Draft')
    """, [profile_id, req.language, req.content])
    return {"status": "success"}

@router.delete("/log/{log_id}")
def delete_log(log_id: int):
    conn = get_db()
    conn.execute("DELETE FROM outreach_log WHERE id = ?", [log_id])
    return {"status": "success"}

@router.post("/bulk")
def bulk_outreach(req: BulkOutreachRequest):
    conn = get_db()
    results = []
    
    for mid in req.member_ids:
        # Fetch member data
        res = conn.execute("SELECT * FROM patient_360 WHERE id_normalized = ?", [mid]).df()
        if res.empty:
            continue
        member_data = res.to_dict(orient="records")[0]
        
        # Render template instead of generating AI content
        context_data = {
            "member_name": member_data.get("member_name", "Valued Member"),
            "measure_description": member_data.get("measure_description", "Preventive Health Visit"),
            "measure_code": member_data.get("measure", "HEDIS-GAP"),
            "gap_closure_action": member_data.get("gap_closure", "Consult with your Primary Care Provider."),
            # Compute remaining_days (lower bound) based on measure code
            "remaining_days": (lambda m: "10" if (m or "").upper() == 'COL' else ("5" if (m or "").upper() == 'OMW' else ("25" if (m or "").upper() == 'SPC' else "TBD")))(member_data.get("measure")),
            "care_gaps": member_data.get("care_gaps", "1"),
            "upcoming_appointment": member_data.get("appointment_date") is not None,
            "appointment_datetime": f"{member_data.get('appointment_date', '')} at {member_data.get('appointment_time', '')}" if member_data.get('appointment_date') else "",
            "appointment_location": member_data.get("appointment_location", "")
        }
        
        email_content = render_template("care_gap_reminder.html", context_data)
        
        # Send real email
        if member_data.get("email"):
            subject = f"Important Update Regarding Your Care - {member_data.get('member_name')}"
            send_real_email(member_data.get("email"), subject, email_content)

        profile_id = member_data.get("profile_member_id", f"M{str(mid).zfill(3)}")
        # Store descriptive message instead of subject
        log_message = f"Sent mail to {member_data.get('member_name', 'Member')}"
        conn.execute("""
            INSERT INTO outreach_log (member_id, channel, language, content, status)
            VALUES (?, 'Email', ?, ?, 'Sent')
        """, [profile_id, member_data.get("primary_language", "English"), log_message])
        results.append(mid)

    return {"status": "success", "processed_ids": results}
