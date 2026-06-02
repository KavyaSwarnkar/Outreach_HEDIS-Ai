"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export function SplashScreen() {
  const [show, setShow] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFadeOut(true), 1800);
    const removeTimer = setTimeout(() => setShow(false), 2500);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  if (!show) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white transition-opacity duration-700 ease-in-out ${
        fadeOut ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      <div className="flex flex-col items-center animate-in zoom-in-95 slide-in-from-bottom-8 fade-in duration-1000 fill-mode-forwards">
        <div className="w-32 h-32 flex items-center justify-center mb-8 transform transition-transform hover:scale-105">
          <Image
            src="/download.png"
            alt="HEDIS Care Logo"
            width={128}
            height={128}
            className="w-full h-full object-contain"
          />
        </div>
        
        <h1 className="text-4xl sm:text-5xl font-extrabold text-orange-950 tracking-tight mb-3 text-center">
          Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-primary">HEDIS Care</span>
        </h1>
        
        <p className="text-orange-900/60 font-medium text-lg tracking-wide animate-pulse">
          Intelligent Healthcare Analytics
        </p>
      </div>
    </div>
  );
}