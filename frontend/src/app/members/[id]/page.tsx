"use client";

import { useEffect, useState } from "react";
import { fetchMember, generateEmail, sendEmail, fetchOutreachLog, saveEmailDraft, deleteOutreachLog } from "@/lib/api";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { 
  User, Activity, MapPin, Mail, Sparkles, Send, Stethoscope, FileText, 
  Smartphone, MessageSquare, Trash2, Save, ExternalLink
} from "lucide-react";
import Link from "next/link"; // Next.js Link for standard page navigation

export default function Member360() {
  const { id } = useParams();
  const [member, setMember] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [emailContent, setEmailContent] = useState("");
  const [editableText, setEditableText] = useState("");
  const [generating, setGenerating] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);

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
  
  const loadLogs = (profileId: string) => {
    fetchOutreachLog().then((allLogs) => {
      const memberLogs = allLogs.filter((log: any) => log.member_id === profileId);
      setLogs(memberLogs);
      
      const draft = memberLogs.find((l: any) => l.status === 'Draft' && l.channel === 'Email');
      if (draft && !emailContent) {
        setEmailContent(draft.content);
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

  if (loading) return <div className="p-8 text-center text-orange-500">Loading patient data...</div>;
  if (!member) return <div className="p-8 text-center text-red-500">Patient not found.</div>;

  // Conditional flag: only true if there is BCS data
  const hasBcsData = member.line_of_business !== null && member.line_of_business !== undefined;

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Patient 360: {member.member_name}</h1>
        
        <div className="flex items-center gap-3">
          
          {/* CONDITIONALLY RENDERED LINK TO NEW PAGE (SAME TAB) */}
          {hasBcsData && (
            <Link href={`/members/${id}/details`}>
              <Button variant="outline" className="flex items-center gap-2 border-slate-300 hover:bg-slate-50 transition-colors">
                More Details <ExternalLink className="w-4 h-4 text-slate-500" />
              </Button>
            </Link>
          )}
          {/* END LINK */}

          <Badge variant={member.priority === 'CRITICAL' ? 'destructive' : member.priority === 'HIGH' ? 'default' : 'secondary'} className="text-sm px-3 py-1">
            {member.priority} PRIORITY
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Demographics & SDOH */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><User className="w-5 h-5 text-slate-600"/> Demographics & SDOH</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-y-3 text-sm">
              <div className="text-slate-500">Member ID</div><div className="font-medium">{member.profile_member_id}</div>
              <div className="text-slate-500">Gender</div><div className="font-medium">{member.gender}</div>
              <div className="text-slate-500">Language</div><div className="font-medium text-slate-700">{member.primary_language}</div>
              <div className="text-slate-500">Address</div><div className="font-medium">{member.address}</div>
            </div>
            <hr className="border-slate-100" />
            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-3">SDOH Profile</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Income Level</span>
                  <Badge variant="outline">{member.income}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Transportation</span>
                  <Badge variant={member.transportation_access === 'N' ? 'destructive' : 'outline'}>{member.transportation_access === 'Y' ? 'Yes' : 'No Access'}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Housing</span>
                  <Badge variant={member.housing_status === 'N' ? 'destructive' : 'outline'}>{member.housing_status === 'Y' ? 'Stable' : 'Unstable'}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Provider Dist.</span>
                  <Badge variant="outline">{member.provider_access}</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Center: HEDIS Measure */}
        <Card className="shadow-sm border-t-4 border-t-[#F37021]">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><Activity className="w-5 h-5 text-slate-600"/> Care Gap Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-slate-500 mb-1">Measure Flagged</div>
              <div className="text-xl font-bold text-slate-900">{member.measure}</div>
              <div className="text-sm text-slate-600 mt-1">{member.measure_description}</div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="bg-slate-50 p-3 rounded-md">
                <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Status</div>
                {member.compliant === "NO" ? (
                  <span className="text-red-600 font-semibold">Open Gap</span>
                ) : (
                  <span className="text-green-600 font-semibold">Compliant</span>
                )}
              </div>
              <div className="bg-slate-50 p-3 rounded-md">
                <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Follow-up</div>
                {member.follow_up === "N" ? (
                  <span className="text-amber-600 font-semibold">Pending</span>
                ) : (
                  <span className="text-slate-700 font-semibold">Done</span>
                )}
              </div>
            </div>

            <div className="pt-2">
              <div className="text-sm font-semibold text-slate-700 mb-2">Recommended Action</div>
              <div className="text-sm bg-blue-50 text-blue-800 p-3 rounded border border-blue-100">
                {member.gap_closure}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right: Medical History */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><Stethoscope className="w-5 h-5 text-slate-600"/> Medical History</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="text-sm text-slate-600">
               <p className="mb-2"><span className="font-medium">Last Claim Date:</span> {member.last_claim_date ? new Date(member.last_claim_date).toLocaleDateString() : 'N/A'}</p>
               <p className="mb-4"><span className="font-medium">Action Plan:</span> {member.next_plan_of_action || 'None'}</p>
             </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Email Generation Section */}
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
                <Button variant="secondary" onClick={handleSaveDraft} className="px-6 py-5 rounded-xl flex items-center gap-2">
                  <Save className="w-4 h-4" /> Save Draft
                </Button>
                <Button onClick={handleSendEmail} className="bg-green-600 hover:bg-green-700 px-6 py-5 rounded-xl flex items-center gap-2">
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