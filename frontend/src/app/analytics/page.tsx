"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function Analytics() {
  const data = [
    { month: 'Jan', gapsClosed: 12, emailsSent: 40 },
    { month: 'Feb', gapsClosed: 19, emailsSent: 45 },
    { month: 'Mar', gapsClosed: 15, emailsSent: 35 },
    { month: 'Apr', gapsClosed: 25, emailsSent: 60 },
    { month: 'May', gapsClosed: 32, emailsSent: 85 },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-orange-800">Insights & Analytics</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Outreach Effectiveness (Mock)</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip cursor={{fill: '#F1F5F9'}} />
                <Bar dataKey="emailsSent" fill="#94A3B8" name="Emails Sent" radius={[4, 4, 0, 0]} />
                <Bar dataKey="gapsClosed" fill="#2563EB" name="Gaps Closed" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
