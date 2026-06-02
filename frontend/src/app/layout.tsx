import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { LayoutWrapper } from "@/components/LayoutWrapper";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "HEDIS Patient Outreach Dashboard",
  description: "AI-powered care gap outreach management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-white text-orange-950 overflow-hidden`}>
        <LayoutWrapper>
          {children}
        </LayoutWrapper>
        
        <Toaster />
      </body>
    </html>
  );
}