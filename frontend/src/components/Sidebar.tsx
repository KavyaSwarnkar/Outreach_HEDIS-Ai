"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Send, Plus, Settings, ChevronLeft, Menu, Home, Activity } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { getCurrentUser, logout } from "@/lib/api";
import { useRouter } from "next/navigation";

export function Sidebar() {

  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const router = useRouter();

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Members", href: "/members", icon: Users },
    { name: "Bulk Outreach", href: "/outreach", icon: Send },
  ];

  async function handleLogout() {
    try {
      await logout();
    } catch (e) {
      // ignore
    }
    try { sessionStorage.removeItem('hedis_token'); } catch { }
    router.push('/login');
  }

  return (
    <div className={`flex h-screen flex-col bg-[#FFF5EE] border-r border-orange-200/60 transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-[320px]'}`}>

      {/* Header / Logo Block */}
      <div className="flex items-center gap-3 h-20 px-4 overflow-visible relative mt-2">
        <div className="w-16 h-16 flex items-center justify-center text-white font-bold text-sm shrink-0">
          <Image
            src="/download.png"
            alt="HEDIS Logo"
            width={58}
            height={58}
            className="w-full h-full object-contain"
          />
        </div>
        {!isCollapsed && (
          <div className="flex flex-col">
            <span className="text-xl font-bold text-orange-950 leading-tight">HEDIS.Ai</span>
            <span className="text-sm text-orange-800/70 font-medium mt-1">Healthcare Intelligence</span>
          </div>
        )}
        <button onClick={() => setIsCollapsed(!isCollapsed)} className="absolute -right-3 top-6 p-1 bg-white border border-orange-200 text-orange-400 hover:text-primary hover:bg-orange-50 rounded-full flex-shrink-0 shadow-sm z-50 transition-colors">
          {isCollapsed ? <Menu className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-1.5 px-3 pt-2">
        {!isCollapsed && <div className="px-3 py-2 text-[11px] font-bold text-orange-400/80 tracking-widest uppercase">Navigation</div>}
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-3 rounded-xl text-base font-semibold transition-all duration-200 border ${isActive
                ? "bg-[#FFDAB9] text-orange-950 border-[#FFDAB9] shadow-sm"
                : "text-orange-900/70 hover:bg-white hover:border-orange-200 border-transparent"
                } ${isCollapsed ? 'justify-center' : ''}`}
              title={isCollapsed ? item.name : undefined}
            >
              <item.icon className={`w-[18px] h-[18px] flex-shrink-0 ${isActive ? "text-primary" : "text-orange-300"}`} />
              {!isCollapsed && <span className="whitespace-nowrap">{item.name}</span>}
            </Link>
          );
        })}
      </div>

      {/* User Profile */}
      <div className="p-4 border-t border-orange-200/60 mt-auto">
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-orange-950 text-white flex items-center justify-center text-xs font-semibold">JD</div>
            {!isCollapsed && <span className="text-sm font-semibold text-orange-950">User</span>}
          </div>
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <button className="text-orange-400 hover:text-primary p-1 transition-colors">
                <Settings className="w-[18px] h-[18px]" />
              </button>
              <Button variant="outline" size="sm" className="text-xs h-8 px-3 ml-1" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function Header() {
  const router = useRouter();
  const [user, setUser] = useState<{ email: string; name: string } | null>(null);

  useEffect(() => {
    let mounted = true;
    getCurrentUser().then((u) => {
      if (mounted) setUser(u);
    }).catch(() => setUser(null));
    return () => { mounted = false; };
  }, []);

  async function handleLogout() {
    try {
      await logout();
    } catch (e) {
      // ignore
    }
    try { sessionStorage.removeItem('hedis_token'); } catch { }
    setUser(null);
    router.push('/login');
  }

  return (
    <header className="h-20 border-b border-orange-200/60 bg-white flex items-center justify-between px-6 shadow-sm z-10 relative">
      <div className="flex items-center gap-3">
        <div className="flex flex-col">
          <span className="font-bold text-slate-900 text-l">HEDIS.Ai Assistant</span>
          <div className="flex items-center gap-2 text-xs font-bold tracking-wide text-emerald-600 mt-1">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
            AVAILABLE — READY TO ASSIST
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        {user && (
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-sm font-semibold">{user.name}</span>
            <Button onClick={handleLogout} className="text-sm h-9">Logout</Button>
          </div>
        )}
      </div>
    </header>
  );
}