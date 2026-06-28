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
  Activity,
  ArrowRight
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
  excellent: { badge: "bg-teal-100 text-teal-800 border-teal-200", bar: "bg-teal-500", text: "text-teal-600" },
  good: { badge: "bg-emerald-100 text-emerald-800 border-emerald-200", bar: "bg-emerald-500", text: "text-emerald-600" },
  fair: { badge: "bg-amber-100 text-amber-800 border-amber-200", bar: "bg-amber-500", text: "text-amber-600" },
  poor: { badge: "bg-orange-100 text-orange-800 border-orange-200", bar: "bg-orange-500", text: "text-orange-600" },
  critical: { badge: "bg-red-100 text-red-800 border-red-200", bar: "bg-red-500", text: "text-red-600" },
};

function healthLabel(status: BlockDailyRecommendation["healthStatus"]) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.03 }
  }
};

const fadeUpItem = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.2 } }
};

export default function Dashboard() {
  const router = useRouter();
  const { toggleChat } = useChat();

  const triggerVoiceWidget = () => {
    const widget = document.querySelector("elevenlabs-convai");
    if (widget && widget.shadowRoot) {
      const btn = widget.shadowRoot.querySelector("button");
      if (btn) { btn.click(); return; }
    }
    toggleChat();
  };
  
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
    fill: isHealthy ? '#0f766e' : '#f59e0b' // Teal-600 vs Amber-500
  }];

  return (
    <AppShell>
      <div className="space-y-8 pb-12">
        <AppPageHeader 
            subtitle="Real-time insights and automated analytics for your entire operation." 
        />

        {/* MAP ROW (Shown First) */}
        <div className="flex flex-col min-h-[450px]">
           <div className="bg-white p-2 rounded-[32px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] h-full w-full overflow-hidden">
              <FarmMapWidget />
           </div>
        </div>

        {/* TOP METRICS */}
        <motion.section 
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {/* Farm Health Card */}
          <motion.div 
             variants={fadeUpItem}
             className="bg-white border border-slate-100 rounded-[32px] p-7 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_40px_rgb(0,0,0,0.08)] transition-all duration-300 relative overflow-hidden flex items-center justify-between group"
          >
            <div className="absolute top-0 right-0 w-48 h-48 bg-teal-500/5 rounded-full blur-3xl pointer-events-none group-hover:bg-teal-500/10 transition-colors duration-700" />
            <div className="relative z-10 flex flex-col h-full justify-center">
              <p className="text-[11px] font-bold tracking-widest text-slate-400 uppercase mb-2">Farm Health</p>
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center text-xs font-black px-3.5 py-1.5 rounded-full border ${isHealthy ? "text-teal-700 bg-teal-50/80 border-teal-200" : "text-amber-700 bg-amber-50/80 border-amber-200"} shadow-sm`}>
                  {isLoadingRecs ? "Analyzing..." : summary?.farmHealthStatus === "good" ? "Optimal" : "Needs attention"}
                </span>
              </div>
            </div>
            
            <div className="h-28 w-28 relative shrink-0 z-10">
              {isLoadingRecs ? (
                <div className="h-20 w-20 rounded-full border-[6px] border-slate-50 border-t-teal-400 animate-spin absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 shadow-inner" />
              ) : (
                <div className="relative h-full w-full group-hover:scale-105 transition-transform duration-500">
                    <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart cx="50%" cy="50%" innerRadius="70%" outerRadius="100%" barSize={10} data={radialData} startAngle={90} endAngle={-270}>
                        <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                        <RadialBar background={{ fill: '#f8fafc' }} dataKey="value" cornerRadius={12} animationDuration={2000} animationEasing="ease-out" />
                        <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="fill-slate-900 font-black text-2xl tracking-tighter">
                        {farmScore}
                        </text>
                    </RadialBarChart>
                    </ResponsiveContainer>
                </div>
              )}
            </div>
          </motion.div>

          {/* Critical Alert Card */}
          <motion.div 
             variants={fadeUpItem}
             className="bg-gradient-to-br from-red-50 to-white border border-red-100 rounded-[32px] p-7 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_40px_rgb(239,68,68,0.1)] transition-all duration-300 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-48 h-48 bg-red-500/5 rounded-full blur-3xl pointer-events-none group-hover:bg-red-500/10 transition-colors duration-700" />
            <div className="flex items-start gap-5 relative z-10 h-full">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-red-500 to-red-400 flex items-center justify-center shrink-0 shadow-lg shadow-red-500/30 group-hover:scale-110 transition-transform duration-500">
                <AlertTriangle className="h-7 w-7 text-white" />
              </div>
              <div className="flex-1 min-w-0 flex flex-col justify-center h-full">
                <div className="flex items-center gap-2 mb-1.5">
                    <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,1)]" />
                    <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest">Active Alert</p>
                </div>
                {isLoadingRecs ? (
                   <div className="space-y-3 mt-2">
                     <div className="h-4 w-3/4 bg-red-200/50 rounded-md animate-pulse" />
                     <div className="h-3 w-1/2 bg-red-200/50 rounded-md animate-pulse" />
                   </div>
                ) : topAlert ? (
                  <>
                    <p className="font-extrabold text-slate-900 text-lg line-clamp-1 tracking-tight">{topAlert.blockName}</p>
                    <p className="text-xs text-slate-600 mt-1 font-medium line-clamp-2 leading-relaxed">{topAlert.message}</p>
                    <Link href="/farm" className="inline-flex items-center gap-1.5 mt-4 text-[11px] font-black uppercase tracking-wider text-red-600 hover:text-red-800 hover:gap-2.5 transition-all">
                       Resolve Issue <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </>
                ) : (
                  <div className="flex flex-col justify-center h-full">
                      <p className="text-sm font-bold text-slate-900">Systems Normal</p>
                      <p className="text-xs text-slate-500 mt-1 font-medium">No critical incidents today.</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Overview Card */}
          <motion.div 
             variants={fadeUpItem}
             className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700/50 rounded-[32px] p-7 shadow-xl hover:shadow-2xl transition-all duration-300 flex flex-col justify-between relative overflow-hidden group"
          >
             <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none group-hover:bg-indigo-500/30 transition-colors duration-700 mix-blend-screen" />
            <div className="flex items-start justify-between relative z-10">
               <div className="h-12 w-12 rounded-2xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center shrink-0 border border-indigo-400/30 backdrop-blur-md group-hover:-rotate-12 transition-transform duration-500">
                  <CalendarIcon className="h-6 w-6" />
               </div>
               <span className="text-[10px] font-black tracking-widest uppercase text-slate-300 bg-white/10 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full shadow-sm">
                 Overview
               </span>
            </div>
            <div className="mt-8 relative z-10">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Active Blocks</p>
              {isLoadingRecs ? (
                  <div className="h-10 w-24 bg-white/10 rounded-lg animate-pulse mt-2" />
              ) : (
                  <div className="flex items-baseline gap-3 mt-1 group-hover:translate-x-2 transition-transform duration-500">
                    <motion.p 
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, type: "spring", bounce: 0.5 }}
                        className="font-black text-white text-5xl tracking-tighter"
                    >
                      {summary?.blockCount ?? 0}
                    </motion.p>
                    <span className="text-xs font-bold text-indigo-300 bg-indigo-500/20 px-2 py-1 rounded-md">
                      {summary?.alertCount ? `${summary.alertCount} flags` : "All clear"}
                    </span>
                  </div>
              )}
            </div>
          </motion.div>
        </motion.section>

        {/* AI Recommendations */}
        <section className="flex flex-col gap-6">
          <div className="bg-white rounded-[32px] border border-slate-100 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />
             <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="flex items-center justify-between mb-6 relative z-10">
              <h3 className="font-black text-slate-900 flex items-center gap-2.5 text-lg tracking-tight">
                 <div className="bg-teal-50 p-2 rounded-xl text-teal-600 border border-teal-100/50 shadow-sm">
                    <Mic className="h-4 w-4" />
                 </div>
                 AI Assistant
              </h3>
              <button
                onClick={() => speakText(recommendationsToSpeechText(blockRecs))}
                disabled={isLoadingRecs || blockRecs.length === 0}
                className="text-xs font-black uppercase tracking-wider text-teal-700 bg-teal-50 border border-teal-200/50 hover:bg-teal-100 hover:shadow-md px-4 py-2 rounded-full flex items-center gap-1.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed group active:scale-95"
              >
                <Play className="h-3 w-3 fill-teal-700 group-hover:scale-110 transition-transform" /> Listen
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 max-h-[450px] fancy-scrollbar relative z-10">
              {isLoadingRecs ? (
                 <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                      <div className="h-4 bg-slate-200 rounded w-1/3 mb-4 animate-pulse" />
                      <div className="space-y-2">
                        <div className="h-3 bg-slate-200 rounded w-full animate-pulse" />
                        <div className="h-3 bg-slate-200 rounded w-4/5 animate-pulse" />
                      </div>
                    </div>
                  ))}
                 </div>
              ) : blockRecs.length > 0 ? (
                <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-4">
                  {blockRecs.map((block) => {
                    const style = healthStyles[block.healthStatus];
                    return (
                      <motion.article 
                        variants={fadeUpItem} 
                        key={block.blockId} 
                        className="group rounded-2xl border border-slate-100 bg-white shadow-sm hover:shadow-xl p-5 hover:border-teal-200 transition-all duration-300 relative overflow-hidden"
                      >
                        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-teal-400 to-teal-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        
                        <div className="flex items-start justify-between mb-3">
                          <h4 className="font-extrabold text-slate-900 flex items-center gap-2 text-[15px] group-hover:text-teal-800 transition-colors tracking-tight">
                            <Leaf className="h-4 w-4 text-teal-600 opacity-70 group-hover:scale-110 group-hover:opacity-100 transition-all" />
                            {block.blockName}
                          </h4>
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border ${style.badge} shadow-sm`}>
                              {healthLabel(block.healthStatus)}
                          </span>
                        </div>
                        <p className="text-sm text-slate-500 leading-relaxed mb-4 line-clamp-2 group-hover:line-clamp-none transition-all duration-500 font-medium">{block.healthSummary}</p>
                        
                        {block.actions.length > 0 && (
                          <div className="pt-3 border-t border-slate-100 break-words bg-slate-50/50 -mx-5 px-5 pb-1">
                            <ul className="space-y-2 mt-1 mb-1">
                              {block.actions.slice(0, 2).map((action, i) => (
                                <li key={i} className="text-xs font-semibold text-slate-700 flex items-start gap-2">
                                  <CheckCircle className="h-4 w-4 text-teal-500 shrink-0 mt-0.5 opacity-80" />
                                  <span className="leading-snug">{action}</span>
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
                <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200">
                   <Leaf className="h-10 w-10 mb-3 text-slate-300" />
                   <p className="text-sm font-bold text-slate-500">No recommendations today.</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* BOTTOM ROW: TASKS, MARKET, ASSISTANT */}
        <motion.section 
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          
          <motion.div variants={fadeUpItem} className="bg-white rounded-[32px] border border-slate-100 p-7 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-slate-100/50 rounded-full blur-2xl pointer-events-none group-hover:bg-teal-50 transition-colors duration-700 -mr-10 -mt-10" />
            <div className="flex items-center justify-between mb-6 relative z-10">
              <h3 className="font-black text-slate-900 text-lg tracking-tight">Field Operations</h3>
               <Link href="/tasks" className="text-[10px] font-black uppercase tracking-wider text-slate-400 hover:text-teal-600 transition-colors flex items-center gap-1 group/link">
                   View All <ArrowRight className="w-3 h-3 group-hover/link:translate-x-1 transition-transform" />
               </Link>
            </div>
            <div className="flex-1 relative z-10">
                {isLoadingRecs ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                       <div key={i} className="flex gap-4 items-center">
                          <div className="h-6 w-6 rounded-full bg-slate-100 animate-pulse" />
                          <div className="flex-1 space-y-2">
                             <div className="h-4 bg-slate-100 rounded w-3/4 animate-pulse" />
                             <div className="h-3 bg-slate-100 rounded w-1/4 animate-pulse" />
                          </div>
                       </div>
                    ))}
                  </div>
                ) : tasks.length > 0 ? (
                  <div className="space-y-3">
                    {tasks.map(t => (
                      <div key={t.id} className="group/task flex items-center gap-4 py-2 hover:-translate-y-0.5 transition-transform cursor-pointer relative overflow-hidden">
                        <div className={`h-7 w-7 rounded-full border-2 flex items-center justify-center shrink-0 transition-all shadow-sm ${t.status === "COMPLETED" ? "bg-teal-500 border-teal-500" : "border-slate-200 bg-white group-hover/task:border-teal-400 group-hover/task:shadow-teal-100"}`}>
                          {t.status === "COMPLETED" && <CheckCircle className="h-3.5 w-3.5 text-white" />}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className={`text-[15px] font-bold truncate transition-colors tracking-tight ${t.status === "COMPLETED" ? "text-slate-400 line-through" : "text-slate-800 group-hover/task:text-teal-700"}`}>
                              {t.title}
                            </p>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 truncate mt-0.5">{t.assignee?.name || "Unassigned"}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                    <div className="h-full flex items-center justify-center">
                        <p className="text-sm font-bold text-slate-400 bg-slate-50 px-4 py-2 rounded-full border border-slate-100">All caught up! No active tasks.</p>
                    </div>
                )}
            </div>
          </motion.div>

          <motion.div variants={fadeUpItem} className="bg-white rounded-[32px] border border-slate-100 p-7 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col relative overflow-hidden group hover:shadow-[0_8px_40px_rgb(0,0,0,0.06)] transition-all">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-black text-slate-900 text-lg tracking-tight">Market Exchange</h3>
               <div className="flex items-center gap-1.5 bg-teal-50 px-2 py-1 rounded-md border border-teal-100/50">
                   <span className="flex h-2 w-2 rounded-full bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.8)] animate-pulse" />
                   <span className="text-[9px] font-black tracking-widest text-teal-700 uppercase">Live</span>
               </div>
            </div>
            <div className="flex-1 flex flex-col justify-center">
                {isLoadingRecs ? (
                  <div className="space-y-6">
                    {[1, 2, 3].map(i => (
                       <div key={i} className="space-y-3">
                         <div className="flex justify-between">
                            <div className="h-4 bg-slate-100 rounded w-1/4 animate-pulse" />
                            <div className="h-4 bg-slate-100 rounded w-1/5 animate-pulse" />
                         </div>
                         <div className="h-2 bg-slate-100 rounded w-full animate-pulse" />
                       </div>
                    ))}
                  </div>
                ) : marketPrices.length > 0 ? (
                  <div className="space-y-5">
                    {marketPrices.map(m => {
                        const trendColor = m.trend === 'up' ? 'text-teal-600 bg-teal-50 border-teal-100' : m.trend === 'down' ? 'text-red-500 bg-red-50 border-red-100' : 'text-slate-500 bg-slate-50 border-slate-100';
                        const barGradient = m.trend === 'up' ? 'from-teal-400 to-teal-500 shadow-teal-500/30' : m.trend === 'down' ? 'from-red-400 to-red-500 shadow-red-500/30' : 'from-slate-300 to-slate-400';
                        const barWidth = Math.min(100, Math.max(10, (m.price / 8500) * 100));
                        
                        return (
                          <div key={m.crop} className="group/market relative cursor-pointer hover:bg-slate-50 p-2 -mx-2 rounded-xl transition-colors">
                            <div className="flex items-end justify-between mb-2">
                                <span className="text-[15px] font-extrabold text-slate-800 capitalize tracking-tight group-hover/market:text-teal-700 transition-colors">{m.crop}</span>
                                <div className="text-right flex items-center justify-end gap-2.5">
                                    <span className="text-[15px] font-black text-slate-900 tracking-tighter">
                                      {m.price.toLocaleString()} <span className="text-xs text-slate-400">KES</span>
                                    </span>
                                    <span className={`text-[10px] font-black flex items-center gap-0.5 px-2 py-0.5 rounded-md border ${trendColor}`}>
                                        {m.trend === 'up' ? <TrendingUp className="h-3 w-3" /> : m.trend === 'down' ? <TrendingDown className="h-3 w-3" /> : <Circle className="h-2 w-2" />}
                                        {m.trend !== 'stable' && `${m.change > 0 ? '+' : ''}${m.change}`}
                                    </span>
                                </div>
                            </div>
                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                                <motion.div 
                                  initial={{ width: 0 }} 
                                  animate={{ width: `${barWidth}%` }} 
                                  transition={{ duration: 1.5, delay: 0.2, type: "spring", bounce: 0.4 }}
                                  className={`h-full rounded-full bg-gradient-to-r shadow-sm ${barGradient}`} 
                                />
                            </div>
                          </div>
                        )
                    })}
                  </div>
                ) : (
                    <div className="h-full flex items-center justify-center">
                        <p className="text-sm font-bold text-slate-400 bg-slate-50 px-4 py-2 rounded-full border border-slate-100">Market closed or offline.</p>
                    </div>
                )}
            </div>
          </motion.div>

          <motion.button
            variants={fadeUpItem}
            type="button"
          onClick={triggerVoiceWidget}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="group relative overflow-hidden bg-gradient-to-br from-teal-900 via-teal-950 to-slate-900 rounded-[32px] p-7 shadow-[0_12px_40px_rgb(13,148,136,0.3)] flex flex-col items-center justify-center text-center min-h-[220px] transition-all border border-teal-800/50 hover:border-teal-400/50 focus:outline-none"
          >
             <div className="absolute inset-0 bg-white opacity-[0.03] mix-blend-overlay group-hover:opacity-[0.06] transition-opacity duration-500" />
            <div className="absolute top-0 right-0 w-48 h-48 bg-teal-400/20 rounded-full blur-3xl pointer-events-none group-hover:bg-teal-400/30 transition-colors duration-700" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none group-hover:bg-emerald-400/30 transition-colors duration-700" />
            
            <div className="relative z-10 h-20 w-20 bg-gradient-to-br from-teal-400 to-emerald-500 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(20,184,166,0.5)] mb-5 group-hover:shadow-[0_0_60px_rgba(20,184,166,0.7)] group-hover:scale-110 transition-all duration-500 border-2 border-white/20">
              <Mic className="h-8 w-8 text-white" />
              <div className="absolute inset-0 rounded-full border-2 border-teal-200 animate-ping opacity-30" style={{ animationDuration: "3s" }} />
              <div className="absolute inset-[-10px] rounded-full border border-emerald-400 animate-ping opacity-10" style={{ animationDuration: "2s", animationDelay: "0.5s" }} />
            </div>
            
            <p className="relative z-10 font-black text-white text-xl tracking-tight group-hover:text-teal-200 transition-colors">Ask AgriTwin AI</p>
            <p className="relative z-10 text-[13px] font-medium text-teal-100/70 mt-2 max-w-[180px] leading-relaxed">Speak or type your farming questions instantly</p>
          </motion.button>

        </motion.section>
      </div>

      <style jsx global>{`
        .fancy-scrollbar::-webkit-scrollbar { width: 6px; }
        .fancy-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .fancy-scrollbar::-webkit-scrollbar-thumb { background-color: #e2e8f0; border-radius: 20px; }
        .fancy-scrollbar::-webkit-scrollbar-thumb:hover { background-color: #cbd5e1; }
      `}</style>
    </AppShell>
  );
}
