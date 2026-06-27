"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  Calendar as CalendarIcon,
  Leaf,
  Play,
  Mic,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Circle,
  Activity
} from "lucide-react";
import { useChat } from "@/components/chat-provider";
import { FarmMapWidget } from "@/components/farm-map-widget";
import { speakText } from "@/lib/speech";
import { recommendationsToSpeechText, type BlockDailyRecommendation } from "@/lib/block-recommendations";
import { AppShell } from "@/components/app-shell";
import { AppPageHeader } from "@/components/app-page-header";
import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from "recharts";

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

const listContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const listItem = {
  hidden: { opacity: 0, scale: 0.95, y: 10 },
  show: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

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
            setTasks(data.slice(0, 4));
        }

        if (marketRes.ok) {
            const data = await marketRes.json();
            setMarketPrices(data.slice(0, 3));
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
  const farmScore = summary?.farmHealthScore ?? 0;
  const isHealthy = farmScore >= 70;

  const radialData = [{
    name: 'Health',
    value: farmScore,
    fill: isHealthy ? '#10b981' : '#f59e0b'
  }];

  return (
    <AppShell>
      <div className="space-y-6">
        <AppPageHeader />

        {/* TOP METRICS */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div 
             initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
             className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm relative overflow-hidden flex items-center justify-between"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-bl-full pointer-events-none" />
            <div>
              <p className="text-sm font-semibold text-slate-600">Farm Health</p>
              <div className="mt-3 flex items-center gap-2">
                <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded-full ${isHealthy ? "text-emerald-700 bg-emerald-100" : "text-amber-700 bg-amber-100"}`}>
                  {isLoadingRecs ? "Syncing..." : summary?.farmHealthStatus === "good" ? "Good" : "Needs attention"}
                </span>
              </div>
            </div>
            
            <div className="h-24 w-24 relative shrink-0">
              {isLoadingRecs ? (
                <div className="h-16 w-16 rounded-full border-[6px] border-slate-100 border-t-emerald-200 animate-spin absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart cx="50%" cy="50%" innerRadius="75%" outerRadius="100%" barSize={8} data={radialData} startAngle={90} endAngle={-270}>
                    <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                    <RadialBar background dataKey="value" cornerRadius={10} animationDuration={1500} />
                    <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="fill-slate-800 font-bold text-xl">
                      {farmScore}%
                    </text>
                  </RadialBarChart>
                </ResponsiveContainer>
              )}
            </div>
          </motion.div>

          <motion.div 
             initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
             className="bg-red-50/80 border border-red-100 rounded-2xl p-5 shadow-sm relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-bl-full pointer-events-none" />
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-xl bg-red-500 flex items-center justify-center shrink-0 shadow-inner shadow-white/20">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-red-700 uppercase tracking-wider text-[10px]">Critical Alert</p>
                {isLoadingRecs ? (
                   <div className="space-y-2 mt-2">
                     <div className="h-4 w-2/3 bg-red-100 rounded animate-pulse" />
                     <div className="h-3 w-1/2 bg-red-100 rounded animate-pulse" />
                   </div>
                ) : topAlert ? (
                  <>
                    <p className="font-bold text-slate-800 mt-1 line-clamp-1">{topAlert.blockName}</p>
                    <p className="text-xs text-slate-600 mt-1 font-medium line-clamp-2">{topAlert.message}</p>
                    <Link href="/farm" className="inline-flex items-center gap-1 mt-3 text-xs font-bold text-red-600 hover:text-red-700 hover:gap-2 transition-all">
                      View Details <Activity className="h-3 w-3" />
                    </Link>
                  </>
                ) : (
                  <p className="text-xs text-slate-500 mt-2 font-medium">All systems stable. No critical alerts today.</p>
                )}
              </div>
            </div>
          </motion.div>

          <motion.div 
             initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
             className="bg-gradient-to-br from-indigo-50/50 to-purple-50/50 border border-indigo-100 rounded-2xl p-5 shadow-sm flex flex-col justify-between relative overflow-hidden"
          >
             <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-bl-full pointer-events-none" />
            <div className="flex items-start justify-between relative z-10">
               <div className="h-10 w-10 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-200">
                  <CalendarIcon className="h-5 w-5" />
               </div>
               <span className="text-[10px] font-bold tracking-wider uppercase text-slate-500 bg-white/60 backdrop-blur-sm border border-slate-200 px-2.5 py-1 rounded-full shadow-sm">
                 Overview
               </span>
            </div>
            <div className="mt-4 relative z-10">
              <p className="text-sm font-semibold text-slate-600">Active Blocks</p>
              {isLoadingRecs ? (
                  <div className="h-8 w-1/3 bg-indigo-100 rounded animate-pulse mt-1" />
              ) : (
                  <div className="flex items-baseline gap-2 mt-1">
                    <p className="font-black text-slate-800 text-4xl tracking-tighter">
                      {summary?.blockCount ?? 0}
                    </p>
                    <span className="text-xs font-semibold text-slate-500">
                      {summary?.alertCount ? `(${summary.alertCount} flags)` : "(All clear)"}
                    </span>
                  </div>
              )}
            </div>
          </motion.div>
        </section>

        {/* MIDDLE ROW: MAP AND RECOMMENDATIONS */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 flex flex-col">
            <div className="flex-1 min-h-[400px]">
                <FarmMapWidget />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-bl-full pointer-events-none" />
             <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-500/5 rounded-tr-full pointer-events-none" />
            <div className="flex items-center justify-between mb-4 relative z-10">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                 <Mic className="h-4 w-4 text-emerald-500" />
                 AI Recommendations
              </h3>
              <button
                onClick={() => speakText(recommendationsToSpeechText(blockRecs))}
                disabled={isLoadingRecs || blockRecs.length === 0}
                className="text-xs font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-full flex items-center gap-1 transition-colors disabled:opacity-50"
              >
                <Play className="h-3 w-3 fill-current" /> Listen
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 max-h-[400px] fancy-scrollbar relative z-10">
              {isLoadingRecs ? (
                 <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="rounded-xl border border-slate-100/60 bg-slate-50/30 p-4">
                      <div className="h-4 bg-slate-200/60 rounded w-1/3 mb-4 animate-pulse" />
                      <div className="space-y-2">
                        <div className="h-3 bg-slate-200/60 rounded w-full animate-pulse" />
                        <div className="h-3 bg-slate-200/60 rounded w-4/5 animate-pulse" />
                      </div>
                    </div>
                  ))}
                 </div>
              ) : blockRecs.length > 0 ? (
                <motion.div variants={listContainer} initial="hidden" animate="show" className="space-y-4">
                  {blockRecs.map((block) => {
                    const style = healthStyles[block.healthStatus];
                    return (
                      <motion.article variants={listItem} key={block.blockId} className="group rounded-xl border border-slate-200 bg-white shadow-sm p-4 hover:border-emerald-200 hover:shadow-md transition-all relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-bold text-slate-800 flex items-center gap-2 text-sm group-hover:text-emerald-700 transition-colors">
                            <Leaf className="h-3.5 w-3.5 text-emerald-600" />
                            {block.blockName}
                          </h4>
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${style.badge}`}>
                              {healthLabel(block.healthStatus)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed mb-3 line-clamp-3 group-hover:line-clamp-none transition-all">{block.healthSummary}</p>
                        
                        {block.actions.length > 0 && (
                          <div className="pt-2 border-t border-slate-100 break-words">
                            <ul className="space-y-1.5 mt-2">
                              {block.actions.slice(0, 2).map((action, i) => (
                                <li key={i} className="text-[11px] font-medium text-slate-700 flex items-start gap-1.5">
                                  <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                  {action}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </motion.article>
                    );
                  })}
                </motion.div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                   <Leaf className="h-8 w-8 mb-2 opacity-20" />
                   <p className="text-sm font-medium">No recommendations today.</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* BOTTOM ROW: TASKS, MARKET, ASSISTANT */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col relative">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-slate-800">Field Operations</h3>
               <Link href="/tasks" className="text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:text-emerald-600 transition-colors">View All →</Link>
            </div>
            <div className="flex-1">
                {isLoadingRecs ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                       <div key={i} className="flex gap-3 items-center">
                          <div className="h-5 w-5 rounded-full bg-slate-200/60 animate-pulse" />
                          <div className="flex-1 space-y-2">
                             <div className="h-3.5 bg-slate-200/60 rounded w-3/4 animate-pulse" />
                             <div className="h-2.5 bg-slate-200/60 rounded w-1/4 animate-pulse" />
                          </div>
                       </div>
                    ))}
                  </div>
                ) : tasks.length > 0 ? (
                  <motion.div variants={listContainer} initial="hidden" animate="show" className="space-y-2">
                    {tasks.map(t => (
                      <motion.div variants={listItem} key={t.id} className="group flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer relative overflow-hidden">
                        <div className="absolute inset-0 bg-emerald-500/0 group-hover:bg-emerald-500/5 transition-colors pointer-events-none" />
                        <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors z-10 ${t.status === "COMPLETED" ? "bg-emerald-500 border-emerald-500" : "border-slate-300 bg-white group-hover:border-emerald-400"}`}>
                          {t.status === "COMPLETED" && <CheckCircle className="h-3 w-3 text-white" />}
                        </div>
                        <div className="min-w-0 flex-1 z-10">
                            <p className={`text-sm font-bold truncate transition-colors ${t.status === "COMPLETED" ? "text-slate-400 line-through" : "text-slate-800 group-hover:text-emerald-700"}`}>
                              {t.title}
                            </p>
                            <p className="text-xs text-slate-500 truncate mt-0.5">{t.assignee?.name || "Unassigned"}</p>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                ) : (
                    <p className="text-sm text-slate-500 font-medium text-center py-8">All caught up! No active tasks.</p>
                )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-slate-800">Live Market Exchange</h3>
               <span className="flex h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />
            </div>
            <div className="flex-1 flex flex-col justify-center">
                {isLoadingRecs ? (
                  <div className="space-y-5">
                    {[1, 2, 3].map(i => (
                       <div key={i} className="space-y-2">
                         <div className="flex justify-between">
                            <div className="h-3.5 bg-slate-200/60 rounded w-1/4 animate-pulse" />
                            <div className="h-3.5 bg-slate-200/60 rounded w-1/5 animate-pulse" />
                         </div>
                         <div className="h-2 bg-slate-200/60 rounded w-full animate-pulse" />
                       </div>
                    ))}
                  </div>
                ) : marketPrices.length > 0 ? (
                  <motion.div variants={listContainer} initial="hidden" animate="show" className="space-y-4">
                    {marketPrices.map(m => {
                        const trendColor = m.trend === 'up' ? 'text-emerald-600' : m.trend === 'down' ? 'text-red-500' : 'text-slate-400';
                        const barColor = m.trend === 'up' ? 'bg-emerald-500' : m.trend === 'down' ? 'bg-red-400' : 'bg-slate-300';
                        // calculate a simulated fill width based on price vs 10000 baseline
                        const barWidth = Math.min(100, Math.max(10, (m.price / 8500) * 100));
                        return (
                          <motion.div variants={listItem} key={m.crop} className="group relative">
                            <div className="flex items-end justify-between mb-1.5">
                                <span className="text-sm font-bold text-slate-800 capitalize">{m.crop}</span>
                                <div className="text-right flex items-center justify-end gap-2">
                                    <span className="text-sm font-bold text-slate-800 font-mono tracking-tight">
                                      KES {m.price.toLocaleString()}
                                    </span>
                                    <span className={`text-[10px] font-bold flex items-center gap-0.5 bg-slate-50 px-1.5 py-0.5 rounded-md ${trendColor}`}>
                                        {m.trend === 'up' ? <TrendingUp className="h-3 w-3" /> : m.trend === 'down' ? <TrendingDown className="h-3 w-3" /> : <Circle className="h-2 w-2" />}
                                        {m.trend !== 'stable' && `${m.change > 0 ? '+' : ''}${m.change}`}
                                    </span>
                                </div>
                            </div>
                            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                <motion.div 
                                  initial={{ width: 0 }} 
                                  animate={{ width: `${barWidth}%` }} 
                                  transition={{ duration: 1.2, delay: 0.1, type: "spring" }}
                                  className={`h-full rounded-full ${barColor}`} 
                                />
                            </div>
                          </motion.div>
                        )
                    })}
                  </motion.div>
                ) : (
                    <p className="text-sm text-slate-500 font-medium text-center py-4">Market closed or offline.</p>
                )}
            </div>
          </div>

          <button
            type="button"
            onClick={toggleChat}
            className="group relative overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 border border-slate-700 shadow-xl flex flex-col items-center justify-center text-center min-h-[180px] transition-all hover:shadow-2xl hover:-translate-y-1"
          >
            <div className="absolute inset-0 bg-[url('/bg_mesh.png')] opacity-10 mix-blend-overlay group-hover:opacity-20 transition-opacity" />
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-emerald-500/20 transition-colors" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-cyan-500/20 transition-colors" />
            
            <div className="relative z-10 h-16 w-16 bg-emerald-500 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.3)] mb-4 group-hover:scale-110 transition-transform duration-500">
              <Mic className="h-7 w-7 text-white" />
              <div className="absolute inset-0 rounded-full border border-emerald-400 animate-ping opacity-20" />
            </div>
            <p className="relative z-10 font-bold text-white text-lg group-hover:text-emerald-400 transition-colors">Tap to Talk to AgriTwin</p>
            <p className="relative z-10 text-xs text-slate-400 mt-2">Get AI advice instantly</p>
          </button>

        </section>
      </div>

      <style jsx global>{`
        .fancy-scrollbar::-webkit-scrollbar { width: 6px; }
        .fancy-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .fancy-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 20px; }
      `}</style>
    </AppShell>
  );
}
