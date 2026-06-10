"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { fetchMember, generateEmail, sendEmail, fetchOutreachLog, saveEmailDraft, deleteOutreachLog } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { 
  UserCheck, Activity, Heart, ShieldAlert, Calendar, Milestone, 
  Sparkles, Mail, Send, FileText, Save 
} from "lucide-react";

export default function MemberExtendedDetails() {
  const { id } = useParams();
  const [member, setMember] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Exact state from your previous outreach file
  const [emailContent, setEmailContent] = useState("");
  const [editableText, setEditableText] = useState("");
  const [generating, setGenerating] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);

  // Exact HTML Parsing Helpers
  const extractTextFromHtml = (html: string) => {
    const div = document.createElement("div");
    div.innerHTML = html;
    return div.innerText || "";
  };

  const convertTextToHtml = (text: string) => {
    if (text.includes("<html>") || text.includes("<div")) {
      return text;
    }
    return text;
  };

  const handleEditableTextChange = (newText: string) => {
    setEditableText(newText);
    setEmailContent(newText);
  };

  // Exact Log & Draft Loading
  const loadLogs = (profileId: string) => {
    fetchOutreachLog().then((allLogs) => {
      const memberLogs = allLogs.filter((log: any) => log.member_id === profileId);
      setLogs(memberLogs);
      
      const draft = memberLogs.find((l: any) => l.status === 'Draft' && l.channel === 'Email');
      if (draft && !emailContent) {
        setEmailContent(draft.content);
        setEditableText(extractTextFromHtml(draft.content));
      }
    });
  };

  useEffect(() => {
    fetchMember(Number(id)).then((data) => {
      setMember(data);
      setLoading(false);
      loadLogs(data.profile_member_id);
    });
  }, [id]);

  // Exact Action Handlers
  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await generateEmail(member.id_normalized);
      setEmailContent(res.content);
      setEditableText(extractTextFromHtml(res.content));
      await saveEmailDraft(member.id_normalized, res.content, member.primary_language);
      toast("Email Template Generated & Saved as Draft");
      loadLogs(member.profile_member_id);
    } catch (e) {
      toast("Error generating email");
    }
    setGenerating(false);
  };

  const handleSaveDraft = async () => {
    try {
      await saveEmailDraft(member.id_normalized, emailContent, member.primary_language);
      toast("Draft updated successfully");
      loadLogs(member.profile_member_id);
    } catch(e) {
      toast("Failed to update draft");
    }
  };

  const handleDeleteLog = async (logId: number) => {
    try {
      await deleteOutreachLog(logId);
      toast("Log deleted");
      loadLogs(member.profile_member_id);
    } catch(e) {
      toast("Failed to delete log");
    }
  };

  const handleSendEmail = async () => {
    try {
      await sendEmail(member.id_normalized, emailContent, member.primary_language);
      toast("Email sent successfully!");
      setEmailContent("");
      loadLogs(member.profile_member_id);
    } catch (e) {
      toast("Failed to send email");
    }
  };

  if (loading) return <div className="p-12 text-center text-orange-500 font-medium">Loading comprehensive patient metadata...</div>;
  if (!member) return <div className="p-12 text-center text-red-500">Member profiles not found.</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 bg-slate-50/50 min-h-screen">
      {/* Header */}
      <div className="border-b border-slate-200 pb-4 flex justify-between items-end">
        <div>
          <span className="text-xs uppercase font-semibold tracking-wider text-orange-600">Extended Healthcare Dossier</span>
          <h1 className="text-3xl font-black text-slate-900 mt-1">{member.member_name}</h1>
          <p className="text-sm text-slate-500 mt-1">Cross-Referenced Member Identifier: <span className="font-mono bg-slate-200 px-1.5 py-0.5 rounded text-slate-700">{member.profile_member_id}</span></p>
        </div>
        <Badge className="bg-blue-600 px-4 py-1.5 text-sm uppercase">{member.line_of_business || 'Medicare'}</Badge>
      </div>

      {/* BCS Clinical Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Card 1: Clinical Gap Status */}
        <Card className="shadow-sm">
          <CardHeader className="bg-white border-b border-slate-100">
            <CardTitle className="text-base flex items-center gap-2 text-slate-800"><ShieldAlert className="w-5 h-5 text-red-500" /> Screening Care Gap Context</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Measure Scope:</span><span className="font-semibold text-slate-800">{member.measure}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Gap Status:</span><Badge variant={member.gap_status === "Open" ? "destructive" : "secondary"}>{member.gap_status || 'Open'}</Badge></div>
            <div className="flex justify-between"><span className="text-slate-500">Gap Detected Date:</span><span className="font-medium">{member.gap_detected_date ? new Date(member.gap_detected_date).toLocaleDateString() : 'N/A'}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Gap Due Deadline:</span><span className="font-medium text-red-600">{member.gap_due_date ? new Date(member.gap_due_date).toLocaleDateString() : 'N/A'}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Days Overdue Count:</span><span className="font-bold text-slate-900">{member.screening_days_overdue || 0} Days</span></div>
          </CardContent>
        </Card>

        {/* Card 2: Risk Profile & Clinical Factors */}
        <Card className="shadow-sm">
          <CardHeader className="bg-white border-b border-slate-100">
            <CardTitle className="text-base flex items-center gap-2 text-slate-800"><Heart className="w-5 h-5 text-pink-500" /> Clinical Vulnerabilities</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Calculated Risk Score:</span><span className="font-bold text-slate-900">{member.screening_risk_score ? `${(member.screening_risk_score * 100).toFixed(1)}%` : 'N/A'}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Family History of Breast Ca:</span><span className="font-medium">{member.family_history_breast_cancer === 'Y' ? 'Yes (Present)' : 'No'}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Comorbidity Index Counter:</span><span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded-full font-semibold">{member.comorbidity_count || 0}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Provider Alerts Engaged:</span><Badge variant={member.provider_alert === 'Y' ? 'default' : 'outline'}>{member.provider_alert === 'Y' ? 'Active Alert' : 'No Alert'}</Badge></div>
          </CardContent>
        </Card>

        {/* Card 3: Provider Assignment & Logistics */}
        <Card className="shadow-sm">
          <CardHeader className="bg-white border-b border-slate-100">
            <CardTitle className="text-base flex items-center gap-2 text-slate-800"><UserCheck className="w-5 h-5 text-teal-600" /> Care Delivery & PCP</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Assigned PCP:</span><span className="font-semibold text-slate-800">{member.pcp_assigned || 'Dr. Unassigned'}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Upcoming PCP Appointment:</span><span className="font-medium text-teal-700">{member.upcoming_pcp_visit_date ? new Date(member.upcoming_pcp_visit_date).toLocaleDateString() : 'None Scheduled'}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Nearest Center Distance:</span><span className="font-medium">{member.nearest_screening_distance ? `${member.nearest_screening_distance} miles` : 'N/A'}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Screening Opt-Out Status:</span><span className="font-medium text-slate-700">{member.screening_opt_out_flag === 'Y' ? 'Opted Out' : 'Active Enrollee'}</span></div>
          </CardContent>
        </Card>

        {/* Card 4: Historical Engagement Metrics */}
        <Card className="shadow-sm">
          <CardHeader className="bg-white border-b border-slate-100">
            <CardTitle className="text-base flex items-center gap-2 text-slate-800"><Calendar className="w-5 h-5 text-purple-600" /> Outreach Engagement History</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Preferred Channel:</span><span className="font-medium text-slate-800">{member.preferred_channel || 'Email'}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Digital Engagement Score:</span><Badge variant={member.digital_engaged === 'Y' ? 'default' : 'outline'}>{member.digital_engaged === 'Y' ? 'High Engagement' : 'Low Engagement'}</Badge></div>
            <div className="flex justify-between"><span className="text-slate-500">Prior Outreach Attempts:</span><span className="font-semibold">{member.prior_outreach_attempts || 0} times</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Last Attempt Channel:</span><span className="font-medium">{member.last_outreach_channel || 'N/A'}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Historical Member Response:</span><span className="font-medium italic text-slate-700">{member.prior_response || 'No Response'}</span></div>
          </CardContent>
        </Card>

        {/* Card 5: Extended SDOH Barriers */}
        <Card className="shadow-sm md:col-span-2">
          <CardHeader className="bg-white border-b border-slate-100">
            <CardTitle className="text-base flex items-center gap-2 text-slate-800"><Milestone className="w-5 h-5 text-amber-600" /> SDOH Social Determinants Metrics</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex justify-between border-b border-slate-100 pb-1"><span className="text-slate-500">Transport Barrier Present:</span><span className="font-medium text-red-600">{member.sdoh_transport_barrier === 'Y' ? 'Yes' : 'No'}</span></div>
              <div className="flex justify-between border-b border-slate-100 pb-1"><span className="text-slate-500">Financial Instability:</span><span className="font-medium text-red-600">{member.sdoh_financial_barrier === 'Y' ? 'Yes' : 'No'}</span></div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between border-b border-slate-100 pb-1"><span className="text-slate-500">Health Literacy Risk:</span><span className="font-medium text-amber-600">{member.sdoh_health_literacy_barrier === 'Y' ? 'Yes (Low Literacy)' : 'Adequate'}</span></div>
              <div className="flex justify-between border-b border-slate-100 pb-1"><span className="text-slate-500">Rural Regional Location:</span><span className="font-medium">{member.rural_flag === 'Y' ? 'Yes (Rural Cluster)' : 'Urban/Suburban'}</span></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Clinical Notes Summary Card */}
      {member.screening_notes && (
        <Card className="shadow-sm border-l-4 border-l-orange-500">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><FileText className="w-5 h-5 text-slate-700" /> Automated Clinical Notes & Guidance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700 text-sm leading-relaxed bg-slate-100 p-4 rounded-xl font-medium italic">
              "{member.screening_notes}"
            </p>
          </CardContent>
        </Card>
      )}

      {/* EXACT AI Email Generation Section Copied from your previous file */}
      <Card className="shadow-sm border-slate-200 overflow-hidden">
        <CardHeader className="bg-white border-b border-slate-100 flex flex-row items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            <CardTitle className="text-slate-900 font-semibold text-lg m-0">AI Outreach Assistant</CardTitle>
          </div>
          <Badge className="bg-purple-50 text-purple-600 hover:bg-purple-100 border border-purple-100 flex items-center gap-1.5 px-3 py-1 shadow-sm">
             <Sparkles className="w-3.5 h-3.5" /> Claude Sonnet
          </Badge>
        </CardHeader>
        <CardContent className="p-6 bg-white">
          {!emailContent && !generating ? (
             <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center text-center bg-slate-50/50">
               <div className="w-12 h-12 bg-white text-slate-600 rounded-xl flex items-center justify-center mb-4 shadow-sm border border-slate-200">
                 <Mail className="w-6 h-6" />
               </div>
               <h4 className="font-semibold text-slate-800 text-base mb-2">Generate Personalized Email</h4>
               <p className="text-slate-500 mb-6 text-sm">Click to create a context-aware outreach email in <span className="font-medium text-slate-700">{member.primary_language}</span>.</p>
               <Button onClick={handleGenerate} disabled={generating} className="bg-[#F37021] hover:bg-[#d9611c] disabled:bg-[#F37021]/50 disabled:opacity-100 text-white flex items-center gap-2 px-6 py-5 rounded-xl shadow-md transition-all">
                 <Sparkles className="w-4 h-4" /> Generate Email
               </Button>
             </div>
          ) : generating ? (
            <div className="border border-slate-200 rounded-2xl p-8 flex flex-col space-y-4">
              <div className="animate-pulse h-4 bg-slate-200 rounded w-3/4"></div>
              <div className="animate-pulse h-4 bg-slate-200 rounded w-1/2"></div>
              <div className="animate-pulse h-4 bg-slate-200 rounded w-5/6"></div>
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div 
                  ref={(el) => {
                    if (el && !el.innerHTML) {
                      el.innerHTML = emailContent;
                    }
                  }}
                  contentEditable
                  suppressContentEditableWarning
                  onInput={(e) => {
                    const newContent = e.currentTarget.innerHTML;
                    setEditableText(newContent);
                    setEmailContent(newContent);
                  }}
                  className="w-full min-h-[700px] p-6 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 text-slate-700 leading-relaxed overflow-y-auto"
                  style={{ whiteSpace: "pre-wrap", wordWrap: "break-word" }}
                />
              </div>

              <div className="flex justify-center gap-3">
                <Button variant="outline" onClick={() => { setEmailContent(""); setEditableText(""); }} className="px-6 py-5 rounded-xl">Discard</Button>
                <Button onClick={handleSendEmail} className="bg-green-600 hover:bg-green-700 px-6 py-5 rounded-xl flex items-center gap-2 text-white">
                  <Send className="w-4 h-4" /> Send Email
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}