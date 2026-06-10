"use client";

import { useEffect, useState } from "react";
import { fetchKPIs, fetchCharts, fetchMembers, fetchOutreachLog } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// --- CHANGED: Added Activity, TrendingUp, and CheckCircle2 to imports ---
import { Users, AlertCircle, PhoneMissed, Mail, Download, Eye, Activity, TrendingUp, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

function formatDateOnly(value?: string | null) {
  if (!value) return "N/A";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.split("T")[0] || "N/A";

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function Dashboard() {
  const [kpis, setKpis] = useState<any>(null);
  const [charts, setCharts] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const router = useRouter();
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);
  const [dialogMembers, setDialogMembers] = useState<any[]>([]);
  const [dialogLoading, setDialogLoading] = useState(false);


  const openMetricDialog = async (metric: string) => {
    setSelectedMetric(metric);
    setDialogLoading(true);
    try {
      if (metric === 'emails') {
        const logs = await fetchOutreachLog();
        setDialogMembers(logs.filter((l: any) => l.channel === 'Email' && l.status === 'Sent'));
      } else {
        const res = await fetchMembers({ limit: 1000 });
        const all = res.data || [];
        if (metric === 'critical') {
          if (kpis?.priority_alerts && kpis.priority_alerts.length > 0) {
            setDialogMembers(kpis.priority_alerts);
          } else {
            // --- CHANGED: Remove "&& m.transportation_access === 'N'" ---
            setDialogMembers(all.filter((m: any) => m.priority === 'CRITICAL'));
          }
        } else if (metric === 'gaps') setDialogMembers(all.filter((m: any) => m.compliant === 'NO'));
        else if (metric === 'followup') setDialogMembers(all.filter((m: any) => m.follow_up === 'N'));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setDialogLoading(false);
    }
  };

  useEffect(() => {
    Promise.all([fetchKPIs(), fetchCharts()]).then(([kpiData, chartData]) => {
      setKpis(kpiData);
      console.log('KPIs:', kpiData);
      setCharts(chartData);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="p-8 text-center text-slate-500">Loading dashboard...</div>;

  const COLORS = ['#2563EB', '#10B981', '#F97316', '#8B5CF6'];
  const overdueSummary = charts?.overdue_summary || {};
  const overdueBuckets = charts?.overdue_buckets || [];
  const topOverduePatients = charts?.top_overdue_patients || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <h1 className="text-2xl font-bold text-slate-900">Dashboard Overview</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
        <Card onClick={() => openMetricDialog('critical')} className="hover:shadow-lg hover:-translate-y-1 cursor-pointer transition-all bg-gradient-to-br from-red-50 to-white border-red-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold text-red-900">Critical Priority Alerts</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-slate-900">{kpis?.priority_alerts?.length || 0}</div>
            <p className="text-xs text-slate-600 mt-1 font-medium leading-tight">
              Open gaps with high risk,<br/>overdue, or barriers.
            </p>
          </CardContent>
        </Card>

        <Card onClick={() => router.push('/members')} className="hover:shadow-lg hover:-translate-y-1 cursor-pointer transition-all bg-gradient-to-br from-blue-50 to-white border-blue-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold text-blue-900">Total Members</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-900">{kpis?.total_members}</div>
          </CardContent>
        </Card>
        
        <Card onClick={() => openMetricDialog('gaps')} className="hover:shadow-lg hover:-translate-y-1 cursor-pointer transition-all bg-gradient-to-br from-amber-50 to-white border-amber-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold text-amber-900">Care Gaps Open</CardTitle>
            <AlertCircle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-900">{kpis?.care_gaps_open}</div>
          </CardContent>
        </Card>

        <Card onClick={() => openMetricDialog('followup')} className="hover:shadow-lg hover:-translate-y-1 cursor-pointer transition-all bg-gradient-to-br from-purple-50 to-white border-purple-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold text-purple-900">Follow-Up Pending</CardTitle>
            <PhoneMissed className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            {/* Change this line from {kpis?.care_gaps_open} to {kpis?.follow_up_pending} */}
            <div className="text-3xl font-bold text-purple-900">{kpis?.follow_up_pending}</div>
          </CardContent>
        </Card>

        <Card onClick={() => openMetricDialog('emails')} className="hover:shadow-lg hover:-translate-y-1 cursor-pointer transition-all bg-gradient-to-br from-emerald-50 to-white border-emerald-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold text-emerald-900">Total Emails Sent</CardTitle>
            <Mail className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-900">{kpis?.total_emails_sent || 0}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base text-slate-900">Members by Measure</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={charts?.members_by_measure}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="count"
                  nameKey="measure"
                  label={({name}: any) => name}
                >
                  {charts?.members_by_measure.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-base text-slate-900">Compliance Rate by Measure (%)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={charts?.compliance_rate}>
                <XAxis dataKey="measure" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="rate" fill="#F97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Analytics & Insights Section */}
      <div className="pt-6 border-t border-slate-200 mt-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Analytics & Insights</h2>
            <p className="text-slate-500 text-sm mt-1">SDOH breakdown, outreach effectiveness, and care gap trends</p>
          </div>
          <Button variant="outline" className="bg-white border-slate-200 text-slate-900 shadow-sm flex items-center gap-2 font-medium">
            <Download className="w-4 h-4" /> Export Report
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Language Distribution */}
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-slate-900">Language Distribution</CardTitle>
              <p className="text-sm text-slate-500">Primary language of enrolled members</p>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {charts?.language_distribution?.map((item: any, idx: number) => {
                const colors = ['bg-sky-500', 'bg-emerald-600', 'bg-amber-500', 'bg-violet-600', 'bg-slate-500'];
                const color = colors[idx % colors.length];
                const maxCount = Math.max(...(charts?.language_distribution?.map((i: any) => i.count) || [1]));
                const width = `${Math.max((item.count / maxCount) * 100, 2)}%`;
                
                return (
                  <div key={idx} className="flex items-center text-sm">
                    <div className="w-24 text-slate-600 truncate">{item.language}</div>
                    <div className="flex-1 flex items-center">
                      <div className="w-full bg-orange-100 rounded-full h-3 overflow-hidden relative">
                        <div className={`h-full rounded-full ${color}`} style={{ width }} />
                      </div>
                    </div>
                    <div className="w-8 text-right font-bold text-slate-900">{item.count}</div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* SDOH Risk Factors */}
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-slate-900">SDOH Risk Factors</CardTitle>
              <p className="text-sm text-slate-500">Social determinants affecting care access</p>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {charts?.sdoh_factors?.map((item: any, idx: number) => {
                const colors = ['bg-sky-500', 'bg-amber-500', 'bg-violet-600', 'bg-emerald-600'];
                const color = colors[idx % colors.length];
                const maxCount = Math.max(...(charts?.sdoh_factors?.map((i: any) => i.count) || [1]));
                const width = `${Math.max((item.count / maxCount) * 100, 2)}%`;

                return (
                  <div key={idx} className="flex items-center text-sm">
                    <div className="w-24 text-slate-600 truncate pr-2 leading-tight">{item.factor}</div>
                    <div className="flex-1 flex items-center">
                      <div className="w-full bg-orange-100 rounded-full h-3 overflow-hidden relative">
                        <div className={`h-full rounded-full ${color}`} style={{ width }} />
                      </div>
                    </div>
                    <div className="w-8 text-right font-bold text-slate-900">{item.count}</div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-sm border-slate-200 overflow-hidden mb-6">
          <CardHeader className="bg-slate-100 border-b border-slate-200">
            <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <Clock className="h-5 w-5 text-red-600" />
              Overdue Patients Insight
            </CardTitle>
            <p className="text-sm text-slate-500">Open care gaps grouped by overdue age from Excel screening data</p>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                <p className="text-sm font-medium text-red-600">Total Overdue Patients</p>
                <p className="text-2xl font-bold text-red-900">{overdueSummary.total_overdue || 0}</p>
              </div>
              <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
                <p className="text-sm font-medium text-amber-600">Average Days Overdue</p>
                <p className="text-2xl font-bold text-amber-900">{overdueSummary.average_days_overdue || 0}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <p className="text-sm font-medium text-slate-600">Highest Days Overdue</p>
                <p className="text-2xl font-bold text-slate-900">{overdueSummary.max_days_overdue || 0}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
              <div className="h-80 w-full">
                <h3 className="text-sm font-semibold text-slate-500 mb-4 uppercase tracking-wider">Overdue Patient Buckets</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={overdueBuckets}>
                    <XAxis dataKey="bucket" axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ fill: '#f8fafc' }} />
                    <Bar dataKey="patient_count" name="Patients" fill="#dc2626" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="w-full overflow-x-auto border rounded-lg border-slate-200">
                <table className="w-full text-sm text-left text-slate-600">
                  <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Patient</th>
                      <th className="px-4 py-3 font-semibold">Measure</th>
                      <th className="px-4 py-3 font-semibold text-right">Days</th>
                      <th className="px-4 py-3 font-semibold">Due Date</th>
                      <th className="px-4 py-3 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topOverduePatients.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-slate-500">No overdue patient records found.</td>
                      </tr>
                    ) : (
                      topOverduePatients.map((patient: any) => (
                        <tr key={`${patient.id_normalized}-${patient.measure}`} className="bg-white border-b hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="font-semibold text-slate-900">{patient.member_name}</div>
                            <div className="text-xs text-slate-500">{patient.profile_member_id}</div>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className="bg-white">{patient.measure}</Badge>
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-red-600">{patient.days_overdue}</td>
                          <td className="px-4 py-3">{formatDateOnly(patient.gap_due_date)}</td>
                          <td className="px-4 py-3 text-right">
                            <Link href={patient.measure === 'BCS' ? `/members/${patient.id_normalized}/details` : `/members/${patient.id_normalized}`}>
                              <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 font-medium">
                                <Eye className="w-4 h-4 mr-2" /> View
                              </Button>
                            </Link>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* --- CHANGED: NEW OUTREACH EFFECTIVENESS WITH TABLE & SUMMARY --- */}
        <Card className="shadow-sm border-slate-200 overflow-hidden mt-8">
          <CardHeader className="bg-slate-100 border-b border-slate-200">
            <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <Activity className="h-5 w-5 text-indigo-600" /> 
              Outreach Analytics & Effectiveness
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            
            {/* Summary Mini-Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-orange-50 p-4 rounded-lg border border-orange-100 flex items-center gap-4">
                <div className="p-3 bg-orange-100 rounded-full text-orange-600">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-orange-600">Total Attempts</p>
                  <p className="text-2xl font-bold text-orange-900">{charts?.outreach_summary?.total_attempts || 0}</p>
                </div>
              </div>
              
              <div className="bg-sky-50 p-4 rounded-lg border border-sky-100 flex items-center gap-4">
                <div className="p-3 bg-sky-100 rounded-full text-sky-600">
                  <PhoneMissed className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-sky-600">Successful Contacts</p>
                  <p className="text-2xl font-bold text-sky-900">{charts?.outreach_summary?.total_successful_contacts || 0}</p>
                </div>
              </div>

              <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-100 flex items-center gap-4">
                <div className="p-3 bg-emerald-100 rounded-full text-emerald-600">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-emerald-600">Total Gaps Closed</p>
                  <p className="text-2xl font-bold text-emerald-900">{charts?.outreach_summary?.total_gaps_closed || 0}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              {/* Outreach Chart */}
              <div className="h-80 w-full">
                <h3 className="text-sm font-semibold text-slate-500 mb-4 uppercase tracking-wider">Gap Closure Trend</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={charts?.outreach_effectiveness}>
                    <XAxis dataKey="month" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ fill: '#f8fafc' }} />
                    <Bar dataKey="value" name="Gaps Closed" fill="#d68e08" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Outreach Table */}
              <div className="w-full overflow-x-auto border rounded-lg border-slate-200">
                <table className="w-full text-sm text-left text-slate-600">
                  <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Month</th>
                      <th className="px-4 py-3 font-semibold text-right">Attempts</th>
                      <th className="px-4 py-3 font-semibold text-right">Contacts</th>
                      <th className="px-4 py-3 font-semibold text-right">Gaps Closed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {charts?.outreach_effectiveness?.map((row: any, idx: number) => (
                      <tr key={idx} className="bg-white border-b hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-slate-900">{row.month}</td>
                        <td className="px-4 py-3 text-right">{row.outreach_attempts}</td>
                        <td className="px-4 py-3 text-right">{row.successful_contacts}</td>
                        <td className="px-4 py-3 text-right text-indigo-600 font-bold">{row.gaps_closed}</td>
                      </tr>
                    ))}
                    {/* Total Row */}
                    <tr className="bg-slate-50 font-bold text-slate-900">
                      <td className="px-4 py-3">TOTAL</td>
                      <td className="px-4 py-3 text-right">{charts?.outreach_summary?.total_attempts || 0}</td>
                      <td className="px-4 py-3 text-right">{charts?.outreach_summary?.total_successful_contacts || 0}</td>
                      <td className="px-4 py-3 text-right text-indigo-700">{charts?.outreach_summary?.total_gaps_closed || 0}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!selectedMetric} onOpenChange={(val) => !val && setSelectedMetric(null)}>
        <DialogContent className="bg-white p-6 rounded-2xl shadow-2xl" style={{ maxWidth: '900px', width: '90vw', maxHeight: '85vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <DialogHeader>
            <DialogTitle>
              {selectedMetric === 'critical' ? 'Critical Priority Alerts' :
               selectedMetric === 'gaps' ? 'Care Gaps Open' :
               selectedMetric === 'emails' ? 'Total Emails Sent' :
               'Follow-Up Pending'}
            </DialogTitle>
          </DialogHeader>
          
          {dialogLoading ? (
            <div className="p-8 text-center text-slate-500">Loading members...</div>
          ) : (
            <div className="mt-4 overflow-y-auto flex-1" style={{ maxHeight: 'calc(85vh - 120px)' }}>
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead>{selectedMetric === 'emails' ? 'Log Details' : 'Member'}</TableHead>
                    <TableHead>{selectedMetric === 'emails' ? 'Channel' : 'Measure'}</TableHead>
                    <TableHead>{selectedMetric === 'emails' ? 'Status' : 'Gap Status'}</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dialogMembers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-slate-500">
                        No records found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    dialogMembers.map((m: any, idx: number) => (
                      <TableRow key={idx}>
                        {selectedMetric === 'emails' ? (
                          <TableCell colSpan={4}>
                            <div className="font-medium text-slate-900">{m.member_id}</div>
                          </TableCell>
                        ) : (
                          <>
                            <TableCell>
                              <div className="font-medium text-slate-900">{m.member_name}</div>
                              <div className="text-xs text-slate-500">{m.profile_member_id}</div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-white">{m.measure}</Badge>
                            </TableCell>
                            <TableCell>
                              {m.compliant === "NO" ? (
                                <Badge variant="secondary" className="bg-red-100 text-red-700 hover:bg-red-200 border-none font-medium shadow-sm">Gap Open</Badge>
                              ) : (
                                <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-200 border-none">Compliant</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <Link href={`/members/${m.id_normalized}`}>
                                <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 font-medium">
                                  <Eye className="w-4 h-4 mr-2" /> View 360
                                </Button>
                              </Link>
                            </TableCell>
                          </>
                        )}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
