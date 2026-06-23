"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertTriangle,
  Calendar as CalendarIcon,
  Leaf,
  Play,
  Mic,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Circle
} from "lucide-react";
import { useChat } from "@/components/chat-provider";
import { FarmMapWidget } from "@/components/farm-map-widget";
import { speakText } from "@/lib/speech";
import { recommendationsToSpeechText, type BlockDailyRecommendation } from "@/lib/block-recommendations";
import { AppShell } from "@/components/app-shell";
import { AppPageHeader } from "@/components/app-page-header";

type RecommendationsSummary = {
  farmHealthScore: number;
  farmHealthStatus: string;
  blockCount: number;
  alertCount: number;
  alerts: { blockName: string; message: string }[];
};

type Task = {
    id: string;
    title: string;
    status: string;
    assignee?: { name: string };
};

type MarketPrice = {
    crop: string;
    price: number;
    trend: "up" | "down" | "stable";
    change: number;
};

const healthStyles: Record<
  BlockDailyRecommendation["healthStatus"],
  { badge: string; bar: string; text: string }
> = {
  excellent: { badge: "bg-emerald-100 text-emerald-800", bar: "bg-emerald-500", text: "text-emerald-600" },
  good: { badge: "bg-emerald-100 text-emerald-700", bar: "bg-emerald-500", text: "text-emerald-600" },
  fair: { badge: "bg-amber-100 text-amber-800", bar: "bg-amber-500", text: "text-amber-600" },
  poor: { badge: "bg-orange-100 text-orange-800", bar: "bg-orange-500", text: "text-orange-600" },
  critical: { badge: "bg-red-100 text-red-800", bar: "bg-red-500", text: "text-red-600" },
};

function healthLabel(status: BlockDailyRecommendation["healthStatus"]) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export default function Dashboard() {
  const router = useRouter();
  const { toggleChat } = useChat();
  
  const [blockRecs, setBlockRecs] = useState<BlockDailyRecommendation[]>([]);
  const [summary, setSummary] = useState<RecommendationsSummary | null>(null);
  const [isLoadingRecs, setIsLoadingRecs] = useState(true);
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [marketPrices, setMarketPrices] = useState<MarketPrice[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoadingRecs(true);
        const [recsRes, tasksRes, marketRes] = await Promise.all([
            fetch("/api/daily-recommendations"),
            fetch("/api/tasks"),
            fetch("/api/market/live")
        ]);

        if (recsRes.status === 404) {
          router.push("/onboarding");
          return;
        }

        if (recsRes.ok) {
          const data = await recsRes.json();
          setBlockRecs(data.blocks ?? []);
          setSummary(data.summary ?? null);
        }

        if (tasksRes.ok) {
            const data = await tasksRes.json();
            setTasks(data.slice(0, 4)); // Only show top 4
        }

        if (marketRes.ok) {
            const data = await marketRes.json();
            setMarketPrices(data.slice(0, 3)); // Only show top 3 crops
        }

      } catch (e) {
        console.error("Failed to fetch dashboard data", e);
      } finally {
        setIsLoadingRecs(false);
      }
    }
    fetchData();
  }, [router]);

  const topAlert = summary?.alerts?.[0];
  const farmScore = summary?.farmHealthScore ?? 78;

  return (
    <AppShell>
      <div className="space-y-6">
        <AppPageHeader />

        {/* TOP METRICS */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-emerald-50/80 border border-emerald-100 rounded-2xl p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-600">Farm Health</p>
                <p className={`text-4xl font-bold mt-1 ${farmScore >= 70 ? "text-emerald-600" : "text-amber-600"}`}>
                  {isLoadingRecs ? "—" : `${farmScore}%`}
                </p>
                <span
                  className={`inline-block mt-2 text-xs font-bold px-2.5 py-1 rounded-full ${
                    farmScore >= 70 ? "text-emerald-700 bg-emerald-100" : "text-amber-700 bg-amber-100"
                  }`}
                >
                  {isLoadingRecs ? "Loading" : summary?.farmHealthStatus === "good" ? "Good" : "Needs attention"}
                </span>
              </div>
              <div className="h-11 w-11 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="mt-4 h-2 rounded-full bg-emerald-100 overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all"
                style={{ width: `${isLoadingRecs ? 0 : farmScore}%` }}
              />
            </div>
          </div>

          <div className="bg-red-50/80 border border-red-100 rounded-2xl p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="h-11 w-11 rounded-full bg-red-500 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-red-700">Alert</p>
                {topAlert ? (
                  <>
                    <p className="font-bold text-slate-800 mt-1">{topAlert.blockName}</p>
                    <p className="text-xs text-slate-600 mt-2 font-medium line-clamp-2">{topAlert.message}</p>
                  </>
                ) : (
                  <p className="text-xs text-slate-600 mt-2 font-medium">No critical alerts today.</p>
                )}
                <Link href="/farm" className="inline-block mt-3 text-xs font-bold text-red-600 hover:text-red-700">
                  View Details →
                </Link>
              </div>
            </div>
          </div>

          <div className="bg-amber-50/80 border border-amber-100 rounded-2xl p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="h-11 w-11 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center shrink-0">
                <CalendarIcon className="h-5 w-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-600">Blocks Monitored</p>
                <p className="font-bold text-slate-800 mt-1 text-2xl">
                  {isLoadingRecs ? "—" : summary?.blockCount ?? 0}
                </p>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  {summary?.alertCount ? `${summary.alertCount} need attention` : "All blocks stable"}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* MIDDLE ROW: MAP AND RECOMMENDATIONS */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          
          <div className="lg:col-span-2 flex flex-col">
            <div className="flex-1 min-h-[400px]">
                <FarmMapWidget />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800">Daily Recommendations</h3>
              <button
                onClick={() => speakText(recommendationsToSpeechText(blockRecs))}
                disabled={isLoadingRecs || blockRecs.length === 0}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
              >
                <Play className="h-3 w-3 fill-current" /> Listen
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto pr-1 max-h-[400px]">
              {isLoadingRecs ? (
                Array(2).fill(0).map((_, i) => (
                    <div key={i} className="rounded-xl border border-slate-100 p-4 animate-pulse">
                      <div className="h-4 bg-slate-100 rounded w-1/3 mb-3" />
                      <div className="h-3 bg-slate-100 rounded w-full mb-2" />
                    </div>
                ))
              ) : blockRecs.length > 0 ? (
                blockRecs.map((block) => {
                  const style = healthStyles[block.healthStatus];
                  return (
                    <article key={block.blockId} className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
                          <Leaf className="h-3.5 w-3.5 text-emerald-600" />
                          {block.blockName}
                        </h4>
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${style.badge}`}>
                            {healthLabel(block.healthStatus)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed mb-3 line-clamp-3">{block.healthSummary}</p>
                      
                      {block.actions.length > 0 && (
                        <ul className="space-y-1">
                          {block.actions.slice(0, 2).map((action, i) => (
                            <li key={i} className="text-[11px] text-slate-700 flex items-start gap-1">
                              <CheckCircle className="h-3 w-3 text-emerald-500 shrink-0" />
                              {action}
                            </li>
                          ))}
                        </ul>
                      )}
                    </article>
                  );
                })
              ) : (
                <p className="text-sm text-slate-500 italic py-8 text-center">No recommendations found.</p>
              )}
            </div>
          </div>
        </section>

        {/* BOTTOM ROW: TASKS, MARKET, ASSISTANT */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800">Recent Tasks</h3>
              <Link href="/tasks" className="text-xs font-bold text-emerald-600 hover:underline">Manage All</Link>
            </div>
            <div className="space-y-3 flex-1">
                {tasks.length > 0 ? tasks.map(t => (
                  <div key={t.id} className="flex items-center gap-3">
                    <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 ${t.status === "COMPLETED" ? "bg-emerald-500 border-emerald-500" : "border-slate-300 bg-white"}`}>
                      {t.status === "COMPLETED" && <CheckCircle className="h-3 w-3 text-white" />}
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-slate-800 truncate">{t.title}</p>
                        <p className="text-xs text-slate-500 truncate">{t.assignee?.name || "Unassigned"}</p>
                    </div>
                  </div>
                )) : (
                    <p className="text-sm text-slate-500 italic text-center py-4">No tasks found.</p>
                )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800">Live Market</h3>
              <Link href="/market" className="text-xs font-bold text-emerald-600 hover:underline">Analytics</Link>
            </div>
            <div className="space-y-3 flex-1">
                {marketPrices.length > 0 ? marketPrices.map(m => (
                    <div key={m.crop} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                        <span className="text-sm font-bold text-slate-800 capitalize">{m.crop}</span>
                        <div className="text-right">
                            <span className="text-sm font-semibold text-slate-700 block">KES {m.price.toLocaleString()}</span>
                            <span className={`text-[10px] font-bold flex items-center justify-end gap-0.5 ${m.trend === 'up' ? 'text-emerald-600' : m.trend === 'down' ? 'text-red-500' : 'text-slate-400'}`}>
                                {m.trend === 'up' ? <TrendingUp className="h-3 w-3" /> : m.trend === 'down' ? <TrendingDown className="h-3 w-3" /> : <Circle className="h-2 w-2" />}
                                {m.trend !== 'stable' && `${m.change > 0 ? '+' : ''}${m.change}%`}
                            </span>
                        </div>
                    </div>
                )) : (
                    <p className="text-sm text-slate-500 italic text-center py-4">Loading market...</p>
                )}
            </div>
          </div>

          <button
            type="button"
            onClick={toggleChat}
            className="bg-gradient-to-br from-slate-800 to-emerald-950 rounded-2xl p-6 border border-slate-700 shadow-lg flex flex-col items-center justify-center text-center min-h-[180px] hover:scale-[1.02] transition-transform group"
          >
            <div className="h-16 w-16 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/40 mb-4 group-hover:scale-105 transition-transform">
              <Mic className="h-8 w-8 text-white" />
            </div>
            <p className="font-bold text-white text-lg">Tap to Talk to AgriTwin</p>
          </button>

        </section>
      </div>
    </AppShell>
  );
}
