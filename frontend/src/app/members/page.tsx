"use client";

import { useEffect, useState, Suspense } from "react";
import { fetchMembers } from "@/lib/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Car, Home, Languages, Eye, Search } from "lucide-react";
import Link from "next/link";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

function MembersList() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const searchQuery = searchParams.get("search") || "";
  
  const [searchInput, setSearchInput] = useState(searchQuery);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterMeasure, setFilterMeasure] = useState("ALL");
  const [filterGap, setFilterGap] = useState("ALL");
  const [filterSdoh, setFilterSdoh] = useState("ALL");
  const [pageSize, setPageSize] = useState("120");
  const [totalMembers, setTotalMembers] = useState(0);

  const formatRiskScore = (score?: number | null) => {
    if (score === null || score === undefined) return "N/A";
    return `${Math.round(score * 100)}%`;
  };

  const getRiskBadgeClass = (score?: number | null) => {
    if (score === null || score === undefined) return "bg-slate-100 text-slate-600 border-slate-200";
    if (score >= 0.7) return "bg-red-100 text-red-700 border-red-200";
    if (score >= 0.4) return "bg-amber-100 text-amber-700 border-amber-200";
    return "bg-emerald-100 text-emerald-700 border-emerald-200";
  };

  useEffect(() => {
    setSearchInput(searchQuery);
  }, [searchQuery]);

  const loadMembers = () => {
    setLoading(true);
    let params: any = { limit: pageSize };
    if (filterMeasure !== "ALL") params.measure = filterMeasure;
    if (filterGap !== "ALL") params.compliant = filterGap;
    if (searchQuery) params.search = searchQuery;
    
    if (filterSdoh === 'HOUSING_N') params.housing = 'N';
    if (filterSdoh === 'HOUSING_Y') params.housing = 'Y';
    if (filterSdoh === 'TRANS_N') params.transportation = 'N';
    if (filterSdoh === 'TRANS_Y') params.transportation = 'Y';
    if (filterSdoh === 'LANG_NOT_EN') params.language_not_english = 'true';
    
    fetchMembers(params).then((data) => {
      setMembers(data.data);
      setTotalMembers(data.total || 0);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadMembers();
  }, [filterMeasure, filterGap, filterSdoh, searchQuery, pageSize]);

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const params = new URLSearchParams(searchParams.toString());
      if (searchInput.trim()) {
        params.set("search", searchInput.trim());
      } else {
        params.delete("search");
      }
      router.push(`${pathname}?${params.toString()}`);
    }
  };

  const getRowColor = (gap: string, followup: string) => {
    return "bg-white transition-colors hover:bg-slate-50 border-b border-slate-100";
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Members Directory</h1>
          {!searchQuery && <p className="text-sm text-slate-500 mt-1">Showing {members.length} of {totalMembers} patient records</p>}
          {searchQuery && <p className="text-sm text-slate-600 mt-1">Showing results for: <span className="font-medium text-slate-900">"{searchQuery}"</span></p>}
        </div>
        <div className="flex flex-nowrap items-center gap-3">
          <div className="flex items-center bg-white border border-slate-200 rounded-md px-2 py-1 w-64 focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-400 transition-all duration-200 shadow-sm h-8">
            <Search className="w-3.5 h-3.5 text-slate-400 mr-1.5 shrink-0" />
            <input 
              type="text" 
              placeholder="Search members..." 
              className="bg-transparent border-none outline-none text-xs w-full text-slate-900 placeholder-slate-400"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleSearch}
            />
          </div>

          <Select value={filterMeasure} onValueChange={(val) => setFilterMeasure(val!)}>
            <SelectTrigger className="w-[130px] text-xs bg-white shadow-sm border-slate-200 h-8 text-slate-700">
              <SelectValue placeholder="Measure">
                {filterMeasure === 'ALL' ? 'All Measures' : filterMeasure}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Measures</SelectItem>
              <SelectItem value="OMW">OMW</SelectItem>
              <SelectItem value="SPC">SPC</SelectItem>
              <SelectItem value="COL">COL</SelectItem>
              <SelectItem value="BCS">BCS</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={filterGap} onValueChange={(val) => setFilterGap(val!)}>
            <SelectTrigger className="w-[130px] text-xs bg-white shadow-sm border-slate-200 h-8 text-slate-700">
              <SelectValue placeholder="Gap Status">
                {filterGap === 'ALL' ? 'All Status' : filterGap === 'NO' ? 'Gap Open' : 'Compliant'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="NO">Gap Open</SelectItem>
              <SelectItem value="YES">Compliant</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={filterSdoh} onValueChange={(val) => setFilterSdoh(val!)}>
            <SelectTrigger className="w-[170px] text-xs bg-white shadow-sm border-slate-200 h-8 text-slate-700">
              <SelectValue placeholder="SDOH Profile">
                {filterSdoh === 'ALL' ? 'All SDOH Profiles' : 
                 filterSdoh === 'HOUSING_N' ? 'Housing Issues' : 
                 filterSdoh === 'HOUSING_Y' ? 'Stable Housing' :
                 filterSdoh === 'TRANS_N' ? 'Transportation Issues' :
                 filterSdoh === 'TRANS_Y' ? 'Adequate Transportation' :
                 'Non-English Speaker'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All SDOH Profiles</SelectItem>
              <SelectItem value="HOUSING_N">Housing Issues</SelectItem>
              <SelectItem value="HOUSING_Y">Stable Housing</SelectItem>
              <SelectItem value="TRANS_N">Transportation Issues</SelectItem>
              <SelectItem value="TRANS_Y">Adequate Transportation</SelectItem>
              <SelectItem value="LANG_NOT_EN">Non-English Speaker</SelectItem>
            </SelectContent>
          </Select>

          <Select value={pageSize} onValueChange={(val) => setPageSize(val!)}>
            <SelectTrigger className="w-[130px] text-xs bg-white shadow-sm border-slate-200 h-8 text-slate-700">
              <SelectValue placeholder="Records per page">
                {pageSize} records
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">30 records per page</SelectItem>
              <SelectItem value="60">60 records per page</SelectItem>
              <SelectItem value="90">90 records per page</SelectItem>
              <SelectItem value="120">All patient records</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50/80 backdrop-blur-sm">
            <TableRow className="border-b border-slate-200">
              <TableHead className="font-semibold text-slate-700 h-12">Member ID</TableHead>
              <TableHead className="font-semibold text-slate-700 h-12">Name</TableHead>
              <TableHead className="font-semibold text-slate-700 h-12">Measure</TableHead>
              <TableHead className="font-semibold text-slate-700 h-12">Risk Score</TableHead>
              <TableHead className="font-semibold text-slate-700 h-12">Gap Status</TableHead>
              <TableHead className="font-semibold text-slate-700 h-12">Follow-Up</TableHead>
              <TableHead className="font-semibold text-slate-700 h-12">SDOH Profile</TableHead>
              <TableHead className="text-right font-semibold text-slate-700 h-12">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={8} className="text-center py-12 text-slate-500 font-medium">Loading directory...</TableCell></TableRow>
            ) : members.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center py-12 text-slate-500">No members found matching your criteria.</TableCell></TableRow>
            ) : members.map((m: any, idx: number) => (
              <TableRow key={`${m.id_normalized}-${m.measure}-${idx}`} className={getRowColor(m.compliant, m.follow_up)}>
                <TableCell className="font-semibold text-slate-900">{m.profile_member_id}</TableCell>
                <TableCell className="font-medium text-slate-700">{m.member_name}</TableCell>
                <TableCell><Badge variant="outline" className="bg-white">{m.measure}</Badge></TableCell>
                <TableCell>
                  <Badge variant="outline" className={getRiskBadgeClass(m.screening_risk_score)}>
                    {formatRiskScore(m.screening_risk_score)}
                  </Badge>
                </TableCell>
                <TableCell>
                  {m.compliant === "NO" ? (
                    <Badge variant="secondary" className="bg-red-100 text-red-700 hover:bg-red-200 border-none font-medium shadow-sm">Gap Open</Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-200 border-none">Compliant</Badge>
                  )}
                </TableCell>
                <TableCell>
                  {m.follow_up === "Y" ? (
                    <Badge variant="outline" className="text-orange-600 border-orange-300 bg-white shadow-sm">Done</Badge>
                  ) : (
                    <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50 shadow-sm">Pending</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2.5 text-slate-400">
                    <span title={`Transport: ${m.transportation_access}`} className={m.transportation_access === 'N' ? 'text-red-500' : ''}>
                      <Car className="w-[18px] h-[18px]" />
                    </span>
                    <span title={`Housing: ${m.housing_status}`} className={m.housing_status === 'N' ? 'text-red-500' : ''}>
                      <Home className="w-[18px] h-[18px]" />
                    </span>
                    <span title={`Language: ${m.primary_language}`} className={m.primary_language !== 'English' ? 'text-slate-600' : ''}>
                      <Languages className="w-[18px] h-[18px]" />
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
  {/* BCS goes to details, everything else goes to the standard [id] page */}
  <Link href={m.measure === 'BCS' ? `/members/${m.id_normalized}/details` : `/members/${m.id_normalized}`}>
    <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800 hover:bg-slate-100 font-medium">
      <Eye className="w-4 h-4 mr-2" /> View 360
    </Button>
  </Link>
</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export default function Members() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-orange-500">Loading Members...</div>}>
      <MembersList />
    </Suspense>
  );
}
