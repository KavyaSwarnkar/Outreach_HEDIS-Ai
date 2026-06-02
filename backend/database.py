import duckdb
import pandas as pd
import os

DB_PATH = "hedis.db"
EXCEL_PATH = "../HEDIS_POC_All_20_Members.xlsx"

def init_db():
    conn = duckdb.connect(DB_PATH)
    
    # Load Excel if it exists and tables are not loaded
    if os.path.exists(EXCEL_PATH):
        try:
            conn.execute("SELECT 1 FROM member_profile LIMIT 1")
        except duckdb.CatalogException:
            # Tables don't exist, load them
            xl = pd.ExcelFile(EXCEL_PATH)
            
            for sheet_name in xl.sheet_names:
                df = xl.parse(sheet_name)
                # Clean column names (replace spaces and special chars)
                df.columns = [c.replace(' ', '_').replace('/', '_').replace('-', '_').lower() for c in df.columns]
                # Register dataframe and create table
                table_name = sheet_name.replace(' ', '_').lower()
                conn.register(f'df_{table_name}', df)
                conn.execute(f"CREATE TABLE IF NOT EXISTS {table_name} AS SELECT * FROM df_{table_name}")
            
            # Create view patient_360
            conn.execute("""
            CREATE OR REPLACE VIEW patient_360 AS
            SELECT 
                CAST(SUBSTRING(p.member_id, 2) AS INT) as id_normalized,
                p.member_id as profile_member_id,
                p.member_name,
                p.email,
                p.address,
                p.gender,
                p.next_plan_of_action,
                p.nearest_hospital,
                q.member_id as qi_member_id,
                q.measure,
                q.complaint_condition as compliant,
                q.follow_up,
                m.complaint_condition as measure_description,
                m.data_elements,
                m.gap_closure,
                s.income,
                s.transportation_access,
                s.primary_language,
                s.mobility_status,
                s.housing_status,
                s.provider_access,
                -- subquery to get last claim date
                (SELECT MAX(start_date_of_service) 
                 FROM medical_claim c 
                 WHERE CAST(SUBSTRING(c.member_id, 2) AS INT) = CAST(SUBSTRING(p.member_id, 2) AS INT)) as last_claim_date,
                -- priority logic
                CASE 
                    WHEN q.complaint_condition = 'NO' AND q.follow_up = 'N' THEN 'CRITICAL'
                    WHEN q.complaint_condition = 'NO' AND q.follow_up = 'Y' THEN 'HIGH'
                    WHEN q.complaint_condition = 'YES' THEN 'MEDIUM'
                    ELSE 'LOW'
                END as priority
            FROM member_profile p
            LEFT JOIN member_qi q ON CAST(SUBSTRING(p.member_id, 2) AS INT) = CAST(SUBSTRING(q.member_id, 2) AS INT)
            LEFT JOIN (
                SELECT measure, 
                       ANY_VALUE(complaint_condition) as complaint_condition, 
                       ANY_VALUE(data_elements) as data_elements, 
                       ANY_VALUE(gap_closure) as gap_closure 
                FROM measure_def GROUP BY measure
            ) m ON q.measure = m.measure
            LEFT JOIN sdoh_data s ON CAST(SUBSTRING(p.member_id, 2) AS INT) = CAST(SUBSTRING(s.member_id, 2) AS INT)
            """)

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
    # Ensure users and sessions tables exist for auth (best-effort)
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

    return conn

def get_db():
    # Return a new connection using the same DB file for multithreading in FastAPI
    return duckdb.connect(DB_PATH)
