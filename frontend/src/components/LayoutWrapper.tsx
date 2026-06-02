"use client";

import { usePathname } from "next/navigation";
import { Sidebar, Header } from "@/components/Sidebar";
import { SplashScreen } from "@/components/SplashScreen";

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === "/login" || pathname === "/signup";

  if (isAuthPage) {
    return <main className="flex-1 bg-white h-screen overflow-y-auto">{children}</main>;
  }

  return (
    <div className="flex h-screen bg-white">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-white">
        <Header />
        <SplashScreen />
        <main className="flex-1 overflow-y-auto p-6 bg-white">
          {children}
        </main>
      </div>
    </div>
  );
}