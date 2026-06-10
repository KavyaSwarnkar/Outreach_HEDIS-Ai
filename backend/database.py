import duckdb
import pandas as pd
import os

DB_PATH = "hedis.db"

EXCEL_PATH = "../HEDIS_POC_All_20_Members.xlsx"
BCS_EXCEL_PATH = "../bcs_email_only_dataset_with_names_M00021 (1).xlsx"

def init_db():
    conn = duckdb.connect(DB_PATH)
    
    p_cols = []
    # 1. Load the main HEDIS dataset
    if os.path.exists(EXCEL_PATH):
        print("✅ Main dataset found! Loading HEDIS tables...")
        xl = pd.ExcelFile(EXCEL_PATH)
        for sheet_name in xl.sheet_names:
            df = xl.parse(sheet_name)
            df.columns = [c.replace(' ', '_').replace('/', '_').replace('-', '_').lower() for c in df.columns]
            table_name = sheet_name.replace(' ', '_').lower()
            
            if table_name == 'member_profile':
                p_cols = list(df.columns)
                
            conn.register(f'df_{table_name}', df)
            conn.execute(f"CREATE OR REPLACE TABLE {table_name} AS SELECT * FROM df_{table_name}")

    b_cols = []
    # 2. Load the secondary BCS dataset
    if os.path.exists(BCS_EXCEL_PATH):
        print("✅ BCS dataset found! Loading BCS tables...")
        bcs_xl = pd.ExcelFile(BCS_EXCEL_PATH)
        for sheet_name in bcs_xl.sheet_names:
            df_bcs = bcs_xl.parse(sheet_name)
            df_bcs.columns = [c.replace(' ', '_').replace('/', '_').replace('-', '_').lower() for c in df_bcs.columns]
            b_cols = list(df_bcs.columns)
            
            bcs_table = "bcs_input_data_sample"
            conn.register(f'df_{bcs_table}', df_bcs)
            conn.execute(f"CREATE OR REPLACE TABLE {bcs_table} AS SELECT * FROM df_{bcs_table}")

    # Helper function to safely extract columns
    def safe_col(col_name, cols_list, prefix):
        return f"{prefix}.{col_name}" if col_name in cols_list else "NULL"

    # Core Demographics mapping
    member_name_expr = "COALESCE(p.member_name, b.member_name, 'Unknown Member')" if "member_name" in b_cols else "COALESCE(p.member_name, 'Unknown Member')"
    email_expr = "COALESCE(p.email, b.email)" if "email" in b_cols else "p.email"
    gender_expr = "COALESCE(p.gender, b.gender)" if "gender" in b_cols else "p.gender"
    address_expr = "COALESCE(p.address, b.address)" if "address" in b_cols else "p.address"
    nearest_hospital_in_p = safe_col("nearest_hospital", p_cols, "p")
    nearest_hospital_in_b = safe_col("nearest_hospital", b_cols, "b")
    nearest_hospital_expr = f"COALESCE({nearest_hospital_in_p}, {nearest_hospital_in_b})"

    # PCP & Visit mapping (checking both files)
    pcp_in_p = safe_col("provider_name", p_cols, "p")
    pcp_in_b = safe_col("pcp_assigned", b_cols, "b")
    pcp_expr = f"COALESCE({pcp_in_b}, {pcp_in_p})"
    
    up_pcp_in_p = safe_col("upcoming_pcp_visit_date", p_cols, "p")
    up_pcp_in_b = safe_col("upcoming_pcp_visit_date", b_cols, "b")
    upcoming_pcp_expr = f"COALESCE({up_pcp_in_b}, {up_pcp_in_p})"

    # Direct BCS Column mapping
    gap_status_expr = safe_col("gap_status", b_cols, "b")
    preferred_lang_expr = safe_col("preferred_language", b_cols, "b")
    phone_expr = safe_col("phone_number", b_cols, "b")
    lob_expr = safe_col("line_of_business", b_cols, "b")
    age_expr = safe_col("age", b_cols, "b")
    risk_in_p = safe_col("risk_score", p_cols, "p")
    risk_in_b = safe_col("risk_score", b_cols, "b")
    risk_expr = f"COALESCE({risk_in_b}, {risk_in_p})"
    income_in_b = safe_col("income", b_cols, "b")
    transportation_access_in_b = safe_col("transportation_access", b_cols, "b")
    mobility_status_in_b = safe_col("mobility_status", b_cols, "b")
    housing_status_in_b = safe_col("housing_status", b_cols, "b")
    provider_access_in_b = safe_col("provider_access", b_cols, "b")
    income_expr = f"COALESCE(s.income, {income_in_b})"
    transportation_access_expr = f"COALESCE(s.transportation_access, {transportation_access_in_b})"
    mobility_status_expr = f"COALESCE(s.mobility_status, {mobility_status_in_b})"
    housing_status_expr = f"COALESCE(s.housing_status, {housing_status_in_b})"
    provider_access_expr = f"COALESCE(s.provider_access, {provider_access_in_b})"
    days_overdue_expr = safe_col("days_overdue", b_cols, "b")
    notes_expr = safe_col("notes", b_cols, "b")
    gap_det_expr = safe_col("gap_detected_date", b_cols, "b")
    gap_due_expr = safe_col("gap_due_date", b_cols, "b")

    nearest_scr_expr = safe_col("nearest_screening_distance", b_cols, "b")
    opt_out_expr = safe_col("screening_opt_out_flag", b_cols, "b")
    family_hist_expr = safe_col("family_history_breast_cancer", b_cols, "b")
    comorbidity_expr = safe_col("comorbidity_count", b_cols, "b")
    provider_alert_expr = safe_col("provider_alert", b_cols, "b")
    preferred_channel_expr = safe_col("preferred_channel", b_cols, "b")
    digital_engaged_expr = safe_col("digital_engaged", b_cols, "b")
    prior_outreach_expr = safe_col("prior_outreach_attempts", b_cols, "b")
    last_outreach_expr = safe_col("last_outreach_channel", b_cols, "b")
    prior_response_expr = safe_col("prior_response", b_cols, "b")
    transport_barrier_expr = safe_col("sdoh_transport_barrier", b_cols, "b")
    financial_barrier_expr = safe_col("sdoh_financial_barrier", b_cols, "b")
    literacy_barrier_expr = safe_col("sdoh_health_literacy_barrier", b_cols, "b")
    rural_flag_expr = safe_col("rural_flag", b_cols, "b")

    # 3. Create view patient_360
    print("🔄 Building patient_360 view...")
    
    # Using clean concatenation to avoid any f-string triple-quote issues
    view_sql = f"""
    CREATE OR REPLACE VIEW patient_360 AS
    WITH all_m AS (
        SELECT member_id FROM member_profile
        UNION
        SELECT member_id FROM bcs_input_data_sample
    )
    SELECT 
        CAST(SUBSTRING(all_m.member_id, 2) AS INT) as id_normalized,
        all_m.member_id as profile_member_id,
        {member_name_expr} as member_name,
        {email_expr} as email,
        {address_expr} as address,
        {gender_expr} as gender,
        p.next_plan_of_action,
        {nearest_hospital_expr} as nearest_hospital,
        COALESCE(q.member_id, b.member_id) as qi_member_id,
        COALESCE(q.measure, CASE WHEN b.member_id IS NOT NULL THEN 'BCS' ELSE NULL END) as measure,
        COALESCE(q.complaint_condition, CASE WHEN {gap_status_expr} = 'Closed' THEN 'YES' ELSE 'NO' END) as compliant,
        COALESCE(q.follow_up, 'N') as follow_up,
        COALESCE(m.complaint_condition, 'Breast Cancer Screening') as measure_description,
        m.data_elements,
        m.gap_closure,
        {income_expr} as income,
        {transportation_access_expr} as transportation_access,
        COALESCE(s.primary_language, {preferred_lang_expr}) as primary_language,
        {mobility_status_expr} as mobility_status,
        {housing_status_expr} as housing_status,
        {provider_access_expr} as provider_access,
        
        {pcp_expr} as pcp_assigned,
        {upcoming_pcp_expr} as upcoming_pcp_visit_date,
        {nearest_scr_expr} as nearest_screening_distance,
        {opt_out_expr} as screening_opt_out_flag,
        {family_hist_expr} as family_history_breast_cancer,
        {comorbidity_expr} as comorbidity_count,
        {provider_alert_expr} as provider_alert,
        {preferred_channel_expr} as preferred_channel,
        {digital_engaged_expr} as digital_engaged,
        {prior_outreach_expr} as prior_outreach_attempts,
        {last_outreach_expr} as last_outreach_channel,
        {prior_response_expr} as prior_response,
        {transport_barrier_expr} as sdoh_transport_barrier,
        {financial_barrier_expr} as sdoh_financial_barrier,
        {literacy_barrier_expr} as sdoh_health_literacy_barrier,
        {rural_flag_expr} as rural_flag,
        {risk_expr} as screening_risk_score,
        {days_overdue_expr} as screening_days_overdue,
        {notes_expr} as screening_notes,
        {age_expr} as age,
        {phone_expr} as phone_number,
        {lob_expr} as line_of_business,
        {gap_status_expr} as gap_status,
        {gap_det_expr} as gap_detected_date,
        {gap_due_expr} as gap_due_date,
        
        (SELECT MAX(start_date_of_service) 
          FROM medical_claim c 
          WHERE CAST(SUBSTRING(c.member_id, 2) AS INT) = CAST(SUBSTRING(all_m.member_id, 2) AS INT)) as last_claim_date,
          
        CASE
            WHEN COALESCE(q.complaint_condition, CASE WHEN {gap_status_expr} = 'Closed' THEN 'YES' ELSE 'NO' END) = 'NO'
                 AND (
                    COALESCE({risk_expr}, 0) >= 0.70
                    OR COALESCE({days_overdue_expr}, 0) >= 365
                    OR (
                        COALESCE({risk_expr}, 0) >= 0.55
                        AND (
                            COALESCE({days_overdue_expr}, 0) >= 180
                            OR {transportation_access_expr} = 'N'
                            OR {housing_status_expr} = 'N'
                            OR COALESCE({transport_barrier_expr}, 'N') = 'Y'
                        )
                    )
                    OR (
                        ({transportation_access_expr} = 'N' OR COALESCE({transport_barrier_expr}, 'N') = 'Y')
                        AND ({housing_status_expr} = 'N' OR COALESCE({financial_barrier_expr}, 'N') = 'Y')
                    )
                 )
                THEN 'CRITICAL'
            WHEN COALESCE(q.complaint_condition, CASE WHEN {gap_status_expr} = 'Closed' THEN 'YES' ELSE 'NO' END) = 'NO'
                 AND (
                    COALESCE({risk_expr}, 0) >= 0.40
                    OR COALESCE({days_overdue_expr}, 0) BETWEEN 31 AND 179
                    OR COALESCE({financial_barrier_expr}, 'N') = 'Y'
                    OR COALESCE({literacy_barrier_expr}, 'N') = 'Y'
                 )
                THEN 'HIGH'
            WHEN COALESCE(q.complaint_condition, CASE WHEN {gap_status_expr} = 'Closed' THEN 'YES' ELSE 'NO' END) = 'NO'
                THEN 'MEDIUM'
            WHEN COALESCE({risk_expr}, 0) >= 0.45
                 OR (
                    ({transportation_access_expr} = 'N' OR COALESCE({transport_barrier_expr}, 'N') = 'Y')
                    AND ({housing_status_expr} = 'N' OR COALESCE({financial_barrier_expr}, 'N') = 'Y' OR COALESCE({literacy_barrier_expr}, 'N') = 'Y')
                 )
                THEN 'MEDIUM'
            ELSE 'LOW'
        END as priority
        
    FROM all_m
    LEFT JOIN member_profile p ON all_m.member_id = p.member_id
    LEFT JOIN bcs_input_data_sample b ON all_m.member_id = b.member_id
    LEFT JOIN member_qi q ON CAST(SUBSTRING(all_m.member_id, 2) AS INT) = CAST(SUBSTRING(q.member_id, 2) AS INT)
    LEFT JOIN (
        SELECT measure,
                ANY_VALUE(complaint_condition) as complaint_condition,
                ANY_VALUE(data_elements) as data_elements,
                ANY_VALUE(gap_closure) as gap_closure 
         FROM measure_def GROUP BY measure
    ) m ON COALESCE(q.measure, CASE WHEN b.member_id IS NOT NULL THEN 'BCS' ELSE NULL END) = m.measure
    LEFT JOIN sdoh_data s ON CAST(SUBSTRING(all_m.member_id, 2) AS INT) = CAST(SUBSTRING(s.member_id, 2) AS INT)
    """
    conn.execute(view_sql)

    # 4. RESTORE DASHBOARD AND AUTH TABLES
    print("🔄 Restoring dashboard analytics and auth tables...")
    
    conn.execute("CREATE SEQUENCE IF NOT EXISTS outreach_seq START 1")
    conn.execute("""
    CREATE TABLE IF NOT EXISTS outreach_log (
        id INTEGER DEFAULT nextval('outreach_seq') PRIMARY KEY,
        member_id VARCHAR,
        channel VARCHAR,
        language VARCHAR,
        content TEXT,
        status VARCHAR,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    conn.execute("""
    CREATE TABLE IF NOT EXISTS outreach_analytics (
        month_name VARCHAR,
        outreach_attempts INTEGER,
        successful_contacts INTEGER,
        gaps_closed INTEGER,
        sort_order INTEGER
    )
    """)
    
    conn.execute("DELETE FROM outreach_analytics")
    conn.execute("""
    INSERT INTO outreach_analytics (month_name, outreach_attempts, successful_contacts, gaps_closed, sort_order) VALUES
    ('Jan', 62, 27, 16, 1),
    ('Feb', 55, 24, 13, 2),
    ('Mar', 45, 24, 16, 3),
    ('Apr', 92, 76, 30, 4),
    ('May', 93, 66, 45, 5)
    """)
    
    try:
        conn.execute("CREATE SEQUENCE IF NOT EXISTS user_seq START 1")
        conn.execute("CREATE SEQUENCE IF NOT EXISTS session_seq START 1")
        conn.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER DEFAULT nextval('user_seq') PRIMARY KEY,
            email VARCHAR UNIQUE,
            name VARCHAR,
            password_hash VARCHAR,
            salt VARCHAR,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """)
        conn.execute("""
        CREATE TABLE IF NOT EXISTS sessions (
            id INTEGER DEFAULT nextval('session_seq') PRIMARY KEY,
            user_id INTEGER,
            session_token VARCHAR UNIQUE,
            expires_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """)
    except Exception:
        pass

    print("✅ Database initialized completely and successfully!")
    return conn

def get_db():
    return duckdb.connect(DB_PATH)

if __name__ == "__main__":
    init_db()
