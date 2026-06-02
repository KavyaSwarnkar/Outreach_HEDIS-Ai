import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

# We will use llama-3.3-70b-versatile or llama-3.1-70b-versatile as requested
# The user wants "best model", Llama 3 70B is currently one of the best on Groq.
MODEL_NAME = "llama-3.3-70b-versatile" 

def get_groq_client():
    api_key = os.getenv("GROQ_API_KEY", "mock_key_if_not_set")
    return Groq(api_key=api_key)

def generate_email_content(member_data: dict) -> str:
    client = get_groq_client()
    
    # Prompt based on user requirements
    system_prompt = f"""You are a compassionate healthcare outreach specialist. 
Generate a short, warm, personalized patient outreach email. 
Address the specific care gap. 
If the patient has no transportation, mention telehealth options. 
If housing is unstable, use extra sensitivity. 
If income is Low, mention that assistance programs may be available. 
Write the email in {member_data.get('primary_language', 'English')}. 
Keep it under 150 words. Sign as 'Your Care Team'."""

    user_prompt = f"""
Patient Name: {member_data.get('member_name')}
Measure: {member_data.get('measure')} 
Complaint Condition: {member_data.get('measure_description')}
Gap Closure Action: {member_data.get('gap_closure')}
Transportation Access: {member_data.get('transportation_access')}
Housing Status: {member_data.get('housing_status')}
Income Level: {member_data.get('income')}
Provider Distance: {member_data.get('provider_access')}
Last Claim Date: {member_data.get('last_claim_date')}
"""

    if client.api_key == "mock_key_if_not_set" or not client.api_key:
        return f"[MOCK EMAIL in {member_data.get('primary_language', 'English')}]\nDear {member_data.get('member_name')},\nThis is a mock generated email addressing {member_data.get('measure')}.\nYour Care Team"

    try:
        response = client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            model=MODEL_NAME,
            temperature=0.7,
            max_tokens=256,
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"Groq API Error: {e}")
        return f"Error generating email: {str(e)}"

def generate_sms_content(member_data: dict) -> str:
    client = get_groq_client()
    system_prompt = f"""You are a compassionate healthcare outreach specialist. 
Generate a short, warm, personalized patient outreach SMS. 
Address the specific care gap. 
If the patient has no transportation, mention telehealth options. 
Write the SMS in {member_data.get('primary_language', 'English')}. 
Keep it under 60 words. Sign as 'Your Care Team'."""

    user_prompt = f"""
Patient Name: {member_data.get('member_name')}
Measure: {member_data.get('measure')} 
Transportation Access: {member_data.get('transportation_access')}
"""

    if client.api_key == "mock_key_if_not_set" or not client.api_key:
        return f"[MOCK SMS] Hello {member_data.get('member_name')}, please schedule your {member_data.get('measure')} screening. - Your Care Team"

    try:
        response = client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            model=MODEL_NAME,
            temperature=0.7,
            max_tokens=100,
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"Groq API Error: {e}")
        return f"Error generating SMS: {str(e)}"
