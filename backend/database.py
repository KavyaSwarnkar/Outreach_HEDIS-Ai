import duckdb
import pandas as pd
import os

DB_PATH = "hedis.db"

# Please ensure these point exactly to your files
EXCEL_PATH = r"C:\Users\ASUS\Downloads\Hedis-ai-kavya\Hedis-ai-kavya\HEDIS_POC_All_20_Members.xlsx"
BCS_EXCEL_PATH = r"C:\Users\ASUS\Downloads\Hedis-ai-kavya\Hedis-ai-kavya\bcs_email_only_dataset_with_names_M00021 (1).xlsx"

def init_db():
    conn = duckdb.connect(DB_PATH)
    
    # 1. Load the main HEDIS dataset
    if os.path.exists(EXCEL_PATH):
        print("✅ Main dataset found! Loading HEDIS tables...")
        xl = pd.ExcelFile(EXCEL_PATH)
        for sheet_name in xl.sheet_names:
            df = xl.parse(sheet_name)
            df.columns = [c.replace(' ', '_').replace('/', '_').replace('-', '_').lower() for c in df.columns]
            table_name = sheet_name.replace(' ', '_').lower()
            conn.register(f'df_{table_name}', df)
            conn.execute(f"CREATE TABLE IF NOT EXISTS {table_name} AS SELECT * FROM df_{table_name}")

    # 2. Load the secondary BCS dataset
    b_cols = []
    if os.path.exists(BCS_EXCEL_PATH):
        print("✅ BCS dataset found! Loading BCS tables...")
        bcs_xl = pd.ExcelFile(BCS_EXCEL_PATH)
        for sheet_name in bcs_xl.sheet_names:
            df_bcs = bcs_xl.parse(sheet_name)
            df_bcs.columns = [c.replace(' ', '_').replace('/', '_').replace('-', '_').lower() for c in df_bcs.columns]
            b_cols = list(df_bcs.columns)
            bcs_table = "bcs_input_data_sample"
            conn.register(f'df_{bcs_table}', df_bcs)
            conn.execute(f"CREATE TABLE IF NOT EXISTS {bcs_table} AS SELECT * FROM df_{bcs_table}")
            
    # Dynamic column expressions for safety
    member_name_expr = "COALESCE(p.member_name, b.member_name, 'Unknown Member')" if "member_name" in b_cols else "COALESCE(p.member_name, 'Unknown Member')"
    email_expr = "COALESCE(p.email, b.email)" if "email" in b_cols else "p.email"
    gender_expr = "COALESCE(p.gender, b.gender)" if "gender" in b_cols else "p.gender"
    address_expr = "COALESCE(p.address, b.address)" if "address" in b_cols else "p.address"
    
    phone_expr = "b.phone_number" if "phone_number" in b_cols else "NULL"
    lob_expr = "b.line_of_business" if "line_of_business" in b_cols else "NULL"
    age_expr = "b.age" if "age" in b_cols else "NULL"
    risk_expr = "b.risk_score" if "risk_score" in b_cols else "NULL"
    days_overdue_expr = "b.days_overdue" if "days_overdue" in b_cols else "NULL"
    notes_expr = "b.notes" if "notes" in b_cols else "NULL"
    gap_status_expr = "b.gap_status" if "gap_status" in b_cols else "NULL"
    preferred_lang_expr = "b.preferred_language" if "preferred_language" in b_cols else "NULL"

    # 3. Create view patient_360
    print("🔄 Building patient_360 view...")
    conn.execute(f"""
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
        p.nearest_hospital,
        COALESCE(q.member_id, b.member_id) as qi_member_id,
        COALESCE(q.measure, CASE WHEN b.member_id IS NOT NULL THEN 'BCS' ELSE NULL END) as measure,
        COALESCE(q.complaint_condition, CASE WHEN {gap_status_expr} = 'Closed' THEN 'YES' ELSE 'NO' END) as compliant,
        COALESCE(q.follow_up, 'N') as follow_up,
        COALESCE(m.complaint_condition, 'Breast Cancer Screening') as measure_description,
        m.data_elements,
        m.gap_closure,
        s.income,
        s.transportation_access,
        COALESCE(s.primary_language, {preferred_lang_expr}) as primary_language,
        s.mobility_status,
        s.housing_status,
        s.provider_access,
        
        {risk_expr} as screening_risk_score,
        {days_overdue_expr} as screening_days_overdue,
        {notes_expr} as screening_notes,
        {age_expr} as age,
        {phone_expr} as phone_number,
        {lob_expr} as line_of_business,
        
        (SELECT MAX(start_date_of_service) 
          FROM medical_claim c 
          WHERE CAST(SUBSTRING(c.member_id, 2) AS INT) = CAST(SUBSTRING(all_m.member_id, 2) AS INT)) as last_claim_date,
          
        CASE 
            WHEN COALESCE(q.complaint_condition, CASE WHEN {gap_status_expr} = 'Closed' THEN 'YES' ELSE 'NO' END) = 'NO' AND COALESCE(q.follow_up, 'N') = 'N' THEN 'CRITICAL'
            WHEN COALESCE(q.complaint_condition, CASE WHEN {gap_status_expr} = 'Closed' THEN 'YES' ELSE 'NO' END) = 'NO' AND COALESCE(q.follow_up, 'N') = 'Y' THEN 'HIGH'
            WHEN COALESCE(q.complaint_condition, CASE WHEN {gap_status_expr} = 'Closed' THEN 'YES' ELSE 'NO' END) = 'YES' THEN 'MEDIUM'
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
    """)

    # 4. RESTORE DASHBOARD AND AUTH TABLES (From your original script)
    print("🔄 Restoring dashboard analytics and auth tables...")
    
    # Create outreach_log table
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

    # Create outreach_analytics table
    conn.execute("""
    CREATE TABLE IF NOT EXISTS outreach_analytics (
        month_name VARCHAR,
        outreach_attempts INTEGER,
        successful_contacts INTEGER,
        gaps_closed INTEGER,
        sort_order INTEGER
    )
    """)
    
    # Clear existing data and insert fresh records
    conn.execute("DELETE FROM outreach_analytics")
    conn.execute("""
    INSERT INTO outreach_analytics (month_name, outreach_attempts, successful_contacts, gaps_closed, sort_order) VALUES
    ('Jan', 62, 27, 16, 1),
    ('Feb', 55, 24, 13, 2),
    ('Mar', 45, 24, 16, 3),
    ('Apr', 92, 76, 30, 4),
    ('May', 93, 66, 45, 5)
    """)
    
    # Ensure users and sessions tables exist for auth
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