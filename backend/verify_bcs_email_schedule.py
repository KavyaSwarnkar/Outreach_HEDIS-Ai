from models.schemas import EmailGenerateRequest
from routers.outreach import generate_email

result = generate_email(EmailGenerateRequest(member_id=24))
content = result["content"]

print("contains_tbd=", "TBD" in content)
print("days_line=", "visit your nearest health care in" in content)

for marker in ["visit your nearest health care in", "Due Date", "Nearest Hospital"]:
    idx = content.find(marker)
    if idx >= 0:
        print(content[idx:idx + 220].replace("\n", " "))
