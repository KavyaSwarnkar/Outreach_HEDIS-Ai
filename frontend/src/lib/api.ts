const API_BASE = "http://127.0.0.1:8080/api";

export async function fetchKPIs() {
  const res = await fetch(`${API_BASE}/dashboard/kpis`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch KPIs');
  return res.json();
}

export async function fetchCharts() {
  const res = await fetch(`${API_BASE}/dashboard/charts`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch charts');
  return res.json();
}

export async function fetchMembers(params = {}) {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${API_BASE}/members?${query}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch members');
  return res.json();
}

export async function fetchMember(id: number) {
  const res = await fetch(`${API_BASE}/members/${id}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch member');
  return res.json();
}

export async function generateEmail(memberId: number) {
  const res = await fetch(`${API_BASE}/outreach/generate-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ member_id: memberId })
  });
  if (!res.ok) throw new Error('Failed to generate email');
  return res.json();
}

export async function sendEmail(memberId: number, content: string, language: string) {
  const res = await fetch(`${API_BASE}/outreach/send-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ member_id: memberId, content, language })
  });
  if (!res.ok) throw new Error('Failed to send email');
  return res.json();
}

export async function sendSMS(memberId: number, content: string, language: string) {
  const res = await fetch(`${API_BASE}/outreach/send-sms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ member_id: memberId, content, language })
  });
  if (!res.ok) throw new Error('Failed to send sms');
  return res.json();
}

export async function fetchOutreachLog() {
  const res = await fetch(`${API_BASE}/outreach/log`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch log');
  return res.json();
}

export async function clearOutreachLog() {
  const res = await fetch(`${API_BASE}/outreach/log/clear`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Failed to clear log');
  return res.json();
}

export async function fetchOutreachAnalytics() {
  const res = await fetch(`${API_BASE}/outreach/analytics`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch analytics');
  return res.json();
}

export async function saveEmailDraft(memberId: number, content: string, language: string) {
  const res = await fetch(`${API_BASE}/outreach/log/draft`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ member_id: memberId, content, language })
  });
  if (!res.ok) throw new Error('Failed to save draft');
  return res.json();
}

export async function deleteOutreachLog(logId: number) {
  const res = await fetch(`${API_BASE}/outreach/log/${logId}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Failed to delete log');
  return res.json();
}

export async function getCurrentUser() {
  return null;
}

export async function logout() {
  return { success: true };
}

export async function login(email: string, password?: string) {
  return { email, session_token: "dummy-token", user: { email, name: "User" } };
}

export async function signup(email: string, name: string, password?: string) {
  return { email, session_token: "dummy-token", user: { email, name: name || "User" } };
}
