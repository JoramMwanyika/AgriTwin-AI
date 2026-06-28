"use client";

import { useSession } from "next-auth/react";
import { Bell, CloudRain, Sun, Cloud, Mic } from "lucide-react";
import { useChat } from "@/components/chat-provider";
import Link from "next/link";
import { useEffect, useState, Suspense } from "react";
import { motion } from "framer-motion";
import { useSearchParams } from "next/navigation";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

// ─── Inner component that uses useSearchParams safely inside Suspense ───────
function StartCallListener({ status }: { status: string }) {
  const searchParams = useSearchParams();

  useEffect(() => {
    if (status === "authenticated" && searchParams.get("startCall") === "true") {
      const interval = setInterval(() => {
        const widget = document.querySelector("elevenlabs-convai");
        if (widget && widget.shadowRoot) {
          const btn = widget.shadowRoot.querySelector("button");
          if (btn) {
            btn.click();
            clearInterval(interval);
            window.history.replaceState({}, "", window.location.pathname);
          }
        }
      }, 300);
      return () => clearInterval(interval);
    }
  }, [status, searchParams]);

  return null;
}

// ─── Public export ────────────────────────────────────────────────────────────
export function AppPageHeader({
  subtitle = "Today's Farm Overview",
}: {
  subtitle?: string;
}) {
  const { data: session, status } = useSession();
  const { toggleChat } = useChat();
  const firstName = session?.user?.name?.split(" ")[0] || "Farmer";

  const handleVoiceAssistantClick = () => {
    const widget = document.querySelector("elevenlabs-convai");
    if (widget && widget.shadowRoot) {
      const btn = widget.shadowRoot.querySelector("button");
      if (btn) {
        btn.click();
        return;
      }
    }
    // Fallback if widget isn't loaded
    toggleChat();
  };

  const [weather, setWeather] = useState<{ temp: number; name: string; condition: string; rainProb?: number } | null>(null);

  // Hide ElevenLabs floating button inside its shadow DOM once loaded
  useEffect(() => {
    if (status !== "authenticated") return;
    const interval = setInterval(() => {
      const widget = document.querySelector("elevenlabs-convai");
      if (widget && widget.shadowRoot) {
        const btn = widget.shadowRoot.querySelector("button");
        if (btn) {
          btn.style.display = "none";
          clearInterval(interval);
        }
      }
    }, 300);
    return () => clearInterval(interval);
  }, [status]);

  useEffect(() => {
    fetch('/api/weather')
      .then(res => res.json())
      .then(data => {
        setWeather({
           temp: Math.round(data.main.temp),
           name: data.name,
           condition: data.weather?.[0]?.main || 'Clouds',
           rainProb: data.clouds?.all || 0,
        });
      })
      .catch(e => console.error("Failed to load weather", e));
  }, []);

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      {/* Safely use useSearchParams inside Suspense — required by Next.js 16 */}
      <Suspense fallback={null}>
        <StartCallListener status={status} />
      </Suspense>

      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">
          {getGreeting()}, {firstName}{" "}
          <span className="inline-block" aria-hidden>
            🌱
          </span>
        </h1>
        <p className="text-slate-500 font-medium mt-1">{subtitle}</p>
        <div className="mt-3 inline-flex items-center gap-3 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-full px-4 py-2 shadow-sm transition-all hover:shadow-md">
          {weather?.condition === 'Clear' ? (
             <Sun className="h-4 w-4 text-amber-500 animate-[spin_10s_linear_infinite]" />
          ) : weather?.condition === 'Rain' ? (
             <CloudRain className="h-4 w-4 text-sky-500" />
          ) : (
             <Cloud className="h-4 w-4 text-slate-400" />
          )}
          <span>{weather ? weather.name : "Locating..."}</span>
          <span className="text-slate-300">|</span>
          <span>{weather ? `${weather.temp}°C` : "--"}</span>
          <span className="text-slate-300">|</span>
          <span>{weather ? `Rain ${weather.rainProb}%` : "--"}</span>
        </div>
      </div>

      <div className="flex items-center gap-4 shrink-0 mt-2 sm:mt-0">
        <motion.button
          type="button"
          onClick={handleVoiceAssistantClick}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="group relative inline-flex items-center overflow-hidden rounded-full p-[1.5px] shadow-md transition-shadow hover:shadow-[0_0_20px_rgba(16,185,129,0.25)] ring-1 ring-slate-200/50"
        >
          <span className="absolute inset-0 block h-full w-full animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#cbd5e1_0%,#10b981_50%,#cbd5e1_100%)] opacity-30 group-hover:opacity-100 transition-opacity duration-500" />
          
          <span className="relative flex h-full w-full items-center gap-2 justify-center rounded-full bg-white px-4 py-2 transition-colors group-hover:bg-emerald-50/90 backdrop-blur-sm shadow-inner">
             <div className="relative flex items-center justify-center">
                <Mic className="relative z-10 h-4 w-4 text-emerald-600 transition-transform group-hover:scale-110" />
                <span className="absolute inset-0 z-0 h-full w-full animate-ping rounded-full bg-emerald-400 opacity-20" />
             </div>
             <span className="bg-gradient-to-r from-slate-700 to-slate-800 bg-clip-text text-sm font-extrabold text-transparent group-hover:from-emerald-700 group-hover:to-teal-800 transition-all font-sans tracking-tight">
                Voice Assistant
             </span>
             <div className="flex items-end gap-[2px] ml-1 opacity-60 group-hover:opacity-100 transition-opacity duration-300 h-3">
                <span className="h-1.5 w-[2px] animate-[pulse_0.7s_ease-in-out_infinite] bg-emerald-500 rounded-t-full" />
                <span className="h-3 w-[2px] animate-[pulse_0.7s_ease-in-out_0.2s_infinite] bg-emerald-500 rounded-t-full" />
                <span className="h-2 w-[2px] animate-[pulse_0.7s_ease-in-out_0.4s_infinite] bg-emerald-500 rounded-t-full" />
             </div>
          </span>
        </motion.button>

        <Link
          href="/alerts"
          className="relative h-11 w-11 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-all duration-300 group"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5 text-slate-600" />
          <span className="absolute -top-0.5 -right-0.5 h-5 min-w-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-[#f4f5f7]">
            3
          </span>
        </Link>
      </div>

      {status === "authenticated" && (
        <>
          {/* @ts-ignore */}
          <elevenlabs-convai agent-id="agent_4501kw6x2xrjfz5s3qrcpvj3k65c"></elevenlabs-convai>
          {/* @ts-ignore */}
          <script src="https://unpkg.com/@elevenlabs/convai-widget-embed" async type="text/javascript"></script>
        </>
      )}
    </div>
  );
}
