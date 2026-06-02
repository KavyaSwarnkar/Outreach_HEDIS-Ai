import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
from dotenv import load_dotenv

load_dotenv()

SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
SMTP_FROM = os.getenv("SMTP_FROM", SMTP_USER)

def send_real_email(to_email: str, subject: str, html_content: str):
    if not SMTP_USER or not SMTP_PASSWORD:
        print(f"[EMAIL] SKIPPED - No credentials configured.")
        print(f"[EMAIL] Debug: SMTP_USER={SMTP_USER}, SMTP_PASSWORD={'*' * len(SMTP_PASSWORD) if SMTP_PASSWORD else 'None'}")
        return False
    
    print(f"[EMAIL] DEBUG - Starting email send process")
    print(f"[EMAIL] DEBUG - From: {SMTP_FROM}")
    print(f"[EMAIL] DEBUG - To: {to_email}")
    print(f"[EMAIL] DEBUG - Subject: {subject}")
    print(f"[EMAIL] DEBUG - SMTP Server: {SMTP_SERVER}:{SMTP_PORT}")
    print(f"[EMAIL] DEBUG - Auth User: {SMTP_USER}")
        
    try:
        msg = MIMEMultipart()
        msg['From'] = SMTP_FROM
        msg['To'] = to_email
        msg['Subject'] = subject
        
        # Notice we changed 'plain' to 'html' here to handle styles perfectly!
        msg.attach(MIMEText(html_content, 'html'))
        
        print(f"[EMAIL] DEBUG - Connecting to SMTP server {SMTP_SERVER}:{SMTP_PORT}...")
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        print(f"[EMAIL] DEBUG - Connected, starting TLS...")
        server.starttls()
        print(f"[EMAIL] DEBUG - TLS started, logging in...")
        server.login(SMTP_USER, SMTP_PASSWORD)
        print(f"[EMAIL] DEBUG - Login successful, sending message...")
        server.send_message(msg)
        server.quit()
        print(f"[EMAIL] SUCCESS - Email sent from {SMTP_FROM} to {to_email} with subject: '{subject}'")
        return True
    except Exception as e:
        print(f"[EMAIL] FAILED - Error sending email from {SMTP_FROM} to {to_email}")
        print(f"[EMAIL] FAILED - Subject: '{subject}'")
        print(f"[EMAIL] FAILED - Error details: {str(e)}")
        import traceback
        traceback.print_exc()
        return False