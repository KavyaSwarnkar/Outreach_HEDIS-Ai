"use client";

import { useEffect, useState } from "react";
import { fetchMembers, fetchOutreachLog, clearOutreachLog, fetchOutreachAnalytics } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, Activity, Eye, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function Outreach() {
  const [members, setMembers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [selectedLog, setSelectedLog] = useState<any>(null);

  // Filters
  const [filterGap, setFilterGap] = useState("ALL");
  const [filterFollowup, setFilterFollowup] = useState("ALL");
  const [filterMeasure, setFilterMeasure] = useState("ALL");

  const loadData = () => {
    let params: any = {};
    if (filterGap !== 'ALL') params.compliant = filterGap;
    if (filterFollowup !== 'ALL') params.follow_up = filterFollowup;
    if (filterMeasure !== 'ALL') params.measure = filterMeasure;
    
    fetchMembers(params)
      .then(res => setMembers(res.data));
    fetchOutreachLog().then(res => setLogs(res));
    fetchOutreachAnalytics().then(res => setAnalytics(res)).catch(() => setAnalytics(null));
  };

  useEffect(() => {
    loadData();
  }, [filterGap, filterFollowup, filterMeasure]);

  const toggleAll = () => {
    if (selected.size === members.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(members.map((m: any) => m.id_normalized)));
    }
  };

  const toggleOne = (id: number) => {
    const newSet = new Set(selected);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelected(newSet);
  };

  const handleBulkOutreach = async () => {
    if (selected.size === 0) return;
    toast("Starting bulk generation & sending...");
    try {
      const res = await fetch("http://127.0.0.1:8080/api/outreach/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ member_ids: Array.from(selected) })
      });

      if (res.ok) {
        toast.success(`Successfully processed ${selected.size} members.`);
        setSelected(new Set());
        loadData(); // refresh logs
      } else {
        toast.error("Bulk process failed.");
      }
    } catch (e) {
      toast.error("Network error.");
    }
  };

  const handleClearLog = async () => {
    if (!confirm("Are you sure you want to clear the entire activity log?")) return;
    try {
      await clearOutreachLog();
      toast.success("Activity log cleared.");
      loadData();
    } catch (e) {
      toast.error("Failed to clear log.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Bulk Outreach Campaign</h1>
        <Button onClick={handleBulkOutreach} disabled={selected.size === 0} className="bg-[#F37021] hover:bg-[#d9611c] text-white disabled:bg-[#F37021]/50 disabled:opacity-100">
          <Send className="w-4 h-4 mr-2" /> 
          Generate & Send ({selected.size})
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader className="bg-slate-50 border-b border-slate-200 pb-4">
            <CardTitle className="text-lg">Outreach Effectiveness</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {analytics && analytics.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics}>
                  <XAxis dataKey="month_name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="outreach_attempts" fill="#F37021" name="Attempts" />
                  <Bar dataKey="successful_contacts" fill="#10b981" name="Successful" />
                  <Bar dataKey="gaps_closed" fill="#3b82f6" name="Gaps Closed" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-slate-500">No analytics data available</div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="bg-slate-50 border-b border-slate-200 pb-3">
            <CardTitle className="text-lg">Summary Metrics</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {analytics && analytics.length > 0 ? (
              <>
                <div className="border-b pb-3">
                  <div className="text-sm text-slate-600">Total Attempts</div>
                  <div className="text-2xl font-bold text-slate-900">{analytics.reduce((sum: number, a: any) => sum + (a.outreach_attempts || 0), 0)}</div>
                </div>
                <div className="border-b pb-3">
                  <div className="text-sm text-slate-600">Successful Contacts</div>
                  <div className="text-2xl font-bold text-green-600">{analytics.reduce((sum: number, a: any) => sum + (a.successful_contacts || 0), 0)}</div>
                </div>
                <div>
                  <div className="text-sm text-slate-600">Gaps Closed</div>
                  <div className="text-2xl font-bold text-blue-600">{analytics.reduce((sum: number, a: any) => sum + (a.gaps_closed || 0), 0)}</div>
                </div>
              </>
            ) : (
              <div className="text-slate-500">No data available</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader className="bg-slate-50 border-b border-slate-200 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Target List</CardTitle>
              <div className="flex gap-2">
                <Select value={filterMeasure} onValueChange={(val) => setFilterMeasure(val!)}>
                  <SelectTrigger className="w-[140px] h-8 text-xs bg-white">
                    <SelectValue placeholder="Measure">
                      {filterMeasure === 'ALL' ? 'All Measures' : filterMeasure}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Measures</SelectItem>
                    <SelectItem value="OMW">OMW</SelectItem>
                    <SelectItem value="SPC">SPC</SelectItem>
                    <SelectItem value="COL">COL</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterGap} onValueChange={(val) => setFilterGap(val!)}>
                  <SelectTrigger className="w-[140px] h-8 text-xs bg-white">
                    <SelectValue placeholder="Gap Status">
                      {filterGap === 'ALL' ? 'All Gaps' : filterGap === 'NO' ? 'Open Gap' : 'Compliant'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Gaps</SelectItem>
                    <SelectItem value="NO">Open Gap</SelectItem>
                    <SelectItem value="YES">Compliant</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterFollowup} onValueChange={(val) => setFilterFollowup(val!)}>
                  <SelectTrigger className="w-[140px] h-8 text-xs bg-white">
                    <SelectValue placeholder="Follow-up">
                      {filterFollowup === 'ALL' ? 'All Status' : filterFollowup === 'N' ? 'Pending' : 'Done'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Status</SelectItem>
                    <SelectItem value="N">Pending</SelectItem>
                    <SelectItem value="Y">Done</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[400px] overflow-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-white z-10 shadow-sm">
                  <TableRow>
                    <TableHead className="w-[50px]"><Checkbox checked={selected.size === members.length && members.length > 0} onCheckedChange={toggleAll} /></TableHead>
                    <TableHead>Member</TableHead>
                    <TableHead>Measure</TableHead>
                    <TableHead>Priority</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((m: any, idx: number) => (
                    <TableRow key={`${m.id_normalized}-${m.measure}-${idx}`}>
                      <TableCell><Checkbox checked={selected.has(m.id_normalized)} onCheckedChange={() => toggleOne(m.id_normalized)} /></TableCell>
                      <TableCell>
                        <div className="font-medium text-slate-900">{m.member_name}</div>
                        <div className="text-xs text-slate-500">{m.primary_language}</div>
                      </TableCell>
                      <TableCell>{m.measure}</TableCell>
                      <TableCell>
                        <Badge variant={m.priority === 'CRITICAL' ? 'destructive' : m.priority === 'HIGH' ? 'default' : 'secondary'} className="text-[10px]">
                          {m.priority}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {members.length === 0 && <TableRow><TableCell colSpan={4} className="text-center py-8 text-slate-500">No members match filters.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="bg-slate-50 border-b border-slate-200 flex flex-row items-center justify-between py-3">
            <CardTitle className="text-lg flex items-center gap-2 m-0 text-slate-800"><Activity className="w-4 h-4"/> Activity Log</CardTitle>
            <Button variant="ghost" size="sm" onClick={handleClearLog} className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 px-2">
              <Trash2 className="w-4 h-4 mr-1" /> Clear
            </Button>
          </CardHeader>
          <CardContent className="p-0 max-h-[400px] overflow-auto">
            <div className="divide-y divide-slate-100">
              {logs.map((log: any, i) => (
                <div key={i} onClick={() => setSelectedLog(log)} className="p-4 hover:bg-slate-50/50 cursor-pointer transition-colors group">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-semibold text-sm text-slate-800 flex items-center gap-2">
                      {log.member_id}
                      <Eye className="w-3.5 h-3.5 text-orange-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </span>
                    <Badge variant="outline" className="text-[10px] bg-green-50 text-green-700 border-green-200">{log.status}</Badge>
                  </div>
                  <div className="text-xs text-slate-500 mb-2 flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">{log.channel}</span>
                    <span>{log.language}</span>
                  </div>
                  
                  {/* --- CHANGED: Hide Raw HTML code in the list view --- */}
                  <div className="text-sm text-slate-700 line-clamp-2 bg-slate-50 border border-slate-100 p-2 rounded italic">
                    {log.content?.includes('<html') || log.content?.includes('<div') 
                      ? "📝 [ HTML Email Template - Click to Preview ]" 
                      : `"${log.content}"`}
                  </div>

                  <div className="text-[10px] text-slate-400 mt-2 text-right">
                    {new Date(log.created_at).toLocaleString()}
                  </div>
                </div>
              ))}
              {logs.length === 0 && <div className="p-8 text-center text-slate-500 text-sm">No outreach history.</div>}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* --- CHANGED: Updated Dialog to securely render HTML template in an iframe --- */}
      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="bg-white p-0 rounded-2xl shadow-2xl overflow-hidden" style={{ maxWidth: '700px', width: '90vw' }}>
          <DialogHeader className="p-6 pb-4 border-b border-slate-100 bg-slate-50">
            <DialogTitle className="text-slate-800 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-orange-600" />
                Outreach Message Preview
              </div>
            </DialogTitle>
            <DialogDescription className="pt-2">
              Sent to {selectedLog?.member_id} via {selectedLog?.channel} in {selectedLog?.language} on {selectedLog ? new Date(selectedLog.created_at).toLocaleString() : ''}
            </DialogDescription>
          </DialogHeader>
          
          <div className="bg-slate-200 p-4">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden h-[60vh] w-full flex flex-col">
              {/* Check if content is HTML; if not, just display it as text */}
              {selectedLog?.content?.includes('<html') || selectedLog?.content?.includes('<div') ? (
                <iframe 
                  srcDoc={selectedLog?.content || ''} 
                  className="w-full h-full border-0 flex-1"
                  title="Email Preview"
                />
              ) : (
                <div className="p-6 text-slate-800 font-medium whitespace-pre-wrap">
                  {selectedLog?.content}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}