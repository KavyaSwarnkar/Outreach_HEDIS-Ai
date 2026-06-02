from fastapi import APIRouter
from database import get_db

router = APIRouter()

@router.get("/kpis")
def get_kpis():
    conn = get_db()

    total_members = conn.execute(
        "SELECT COUNT(DISTINCT profile_member_id) FROM patient_360"
    ).fetchone()[0]

    care_gaps_open = conn.execute(
        "SELECT COUNT(*) FROM patient_360 WHERE compliant = 'NO'"
    ).fetchone()[0]

    follow_up_pending = conn.execute(
        "SELECT COUNT(*) FROM patient_360 WHERE follow_up = 'N'"
    ).fetchone()[0]

    total_emails_sent = conn.execute("""
        SELECT COUNT(*)
        FROM outreach_log
        WHERE channel = 'Email' AND status = 'Sent'
    """).fetchone()[0]

    priority_alerts = conn.execute("""
        SELECT id_normalized,
               member_name,
               measure,
               transportation_access,
               compliant
        FROM patient_360
        WHERE priority = 'CRITICAL'
    """).fetchall()

    alerts = [
        {
            "id_normalized": a[0],
            "member_name": a[1],
            "measure": a[2],
            "transportation_access": a[3],
            "compliant": a[4]
        }
        for a in priority_alerts
    ]

    return {
        "total_members": total_members,
        "care_gaps_open": care_gaps_open,
        "follow_up_pending": follow_up_pending,
        "total_emails_sent": total_emails_sent,
        "priority_alerts": alerts
    }

@router.get("/charts")
def get_charts():
    conn = get_db()
    
    # Donut chart: Members by Measure
    measure_counts = conn.execute("SELECT measure, COUNT(*) FROM patient_360 GROUP BY measure").fetchall()
    members_by_measure = [{"measure": r[0], "count": r[1]} for r in measure_counts]
    
    # Bar chart: Compliance rate by measure
    compliance_stats = conn.execute("""
        SELECT measure, 
               COUNT(*) as total, 
               SUM(CASE WHEN compliant = 'YES' THEN 1 ELSE 0 END) as compliant_count
        FROM patient_360 
        GROUP BY measure
    """).fetchall()
    
    compliance_rate = [{"measure": r[0], "rate": round(r[2]/r[1]*100, 2) if r[1] > 0 else 0} for r in compliance_stats]
    
    # Language Distribution
    lang_counts = conn.execute("SELECT primary_language, COUNT(*) FROM patient_360 GROUP BY primary_language ORDER BY COUNT(*) DESC").fetchall()
    language_distribution = [{"language": r[0] if r[0] else 'Unknown', "count": r[1]} for r in lang_counts]

    # SDOH Risk Factors
    no_transport = conn.execute("SELECT COUNT(*) FROM patient_360 WHERE transportation_access = 'N'").fetchone()[0]
    unstable_housing = conn.execute("SELECT COUNT(*) FROM patient_360 WHERE housing_status = 'N'").fetchone()[0]
    low_income = conn.execute("SELECT COUNT(*) FROM patient_360 WHERE income = 'Low'").fetchone()[0]
    far_provider = conn.execute("SELECT COUNT(*) FROM patient_360 WHERE provider_access = 'More Than 10 Miles'").fetchone()[0]

    sdoh_factors = [
        {"factor": "No Transport", "count": no_transport},
        {"factor": "Unstable Housing", "count": unstable_housing},
        {"factor": "Low Income", "count": low_income},
        {"factor": "Far Provider (>10mi)", "count": far_provider},
    ]

    # --- MOVED FROM OUTREACH ---
    # Real outreach analytics data for the graph and table
    analytics_df = conn.execute("SELECT month_name, outreach_attempts, successful_contacts, gaps_closed FROM outreach_analytics ORDER BY sort_order ASC").df()
    analytics_df = analytics_df.where(analytics_df.notnull(), None)
    
    outreach_effectiveness = []
    for row in analytics_df.to_dict(orient="records"):
        outreach_effectiveness.append({
            "month": row["month_name"],
            "value": row["gaps_closed"], # Passed as 'value' so your existing graph still works
            "outreach_attempts": row["outreach_attempts"],
            "successful_contacts": row["successful_contacts"],
            "gaps_closed": row["gaps_closed"]
        })

    # Summary Metrics (Calculated Totals)
    total_attempts = int(analytics_df["outreach_attempts"].sum()) if not analytics_df.empty else 0
    total_success = int(analytics_df["successful_contacts"].sum()) if not analytics_df.empty else 0
    total_closed = int(analytics_df["gaps_closed"].sum()) if not analytics_df.empty else 0

    outreach_summary = {
        "total_attempts": total_attempts,
        "total_successful_contacts": total_success,
        "total_gaps_closed": total_closed
    }

    return {
        "members_by_measure": members_by_measure,
        "compliance_rate": compliance_rate,
        "language_distribution": language_distribution,
        "sdoh_factors": sdoh_factors,
        "outreach_effectiveness": outreach_effectiveness,
        "outreach_summary": outreach_summary # New object for the summary metrics
    }