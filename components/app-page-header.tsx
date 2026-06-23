"use client";

import { useSession } from "next-auth/react";
import { Bell, CloudRain, Mic } from "lucide-react";
import { useChat } from "@/components/chat-provider";
import Link from "next/link";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function AppPageHeader({
  subtitle = "Today's Farm Overview",
}: {
  subtitle?: string;
}) {
  const { data: session } = useSession();
  const { toggleChat } = useChat();
  const firstName = session?.user?.name?.split(" ")[0] || "Farmer";

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">
          {getGreeting()}, {firstName}{" "}
          <span className="inline-block" aria-hidden>
            🌱
          </span>
        </h1>
        <p className="text-slate-500 font-medium mt-1">{subtitle}</p>
        <div className="mt-3 inline-flex items-center gap-3 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-full px-4 py-2 shadow-sm">
          <CloudRain className="h-4 w-4 text-sky-500" />
          <span>Nairobi</span>
          <span className="text-slate-300">|</span>
          <span>24°C</span>
          <span className="text-slate-300">|</span>
          <span>Rain 40%</span>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <button
          type="button"
          onClick={toggleChat}
          className="inline-flex items-center gap-2 bg-white border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 text-slate-700 font-semibold text-sm px-4 py-2.5 rounded-full shadow-sm transition-colors"
        >
          <Mic className="h-4 w-4 text-emerald-600" />
          Voice Assistant
        </button>
        <Link
          href="/alerts"
          className="relative h-11 w-11 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm hover:bg-slate-50 transition-colors"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5 text-slate-600" />
          <span className="absolute -top-0.5 -right-0.5 h-5 min-w-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-[#f4f5f7]">
            3
          </span>
        </Link>
      </div>
    </div>
  );
}
