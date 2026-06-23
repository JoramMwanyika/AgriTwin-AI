"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertTriangle,
  Calendar as CalendarIcon,
  Droplets,
  Leaf,
  Play,
  Mic,
  CheckCircle,
  TrendingUp,
  Lock,
  Sprout,
  Thermometer,
  FlaskConical,
} from "lucide-react";
import { useChat } from "@/components/chat-provider";
import { FarmMapWidget } from "@/components/farm-map-widget";
import { speakText } from "@/lib/speech";
import { recommendationsToSpeechText, type BlockDailyRecommendation } from "@/lib/block-recommendations";
import Image from "next/image";
import { AppShell } from "@/components/app-shell";
import { AppPageHeader } from "@/components/app-page-header";

type RecommendationsSummary = {
  farmHealthScore: number;
  farmHealthStatus: string;
  blockCount: number;
  alertCount: number;
  alerts: { blockName: string; message: string }[];
};

const healthStyles: Record<
  BlockDailyRecommendation["healthStatus"],
  { badge: string; bar: string; text: string }
> = {
  excellent: {
    badge: "bg-emerald-100 text-emerald-800",
    bar: "bg-emerald-500",
    text: "text-emerald-600",
  },
  good: {
    badge: "bg-emerald-100 text-emerald-700",
    bar: "bg-emerald-500",
    text: "text-emerald-600",
  },
  fair: {
    badge: "bg-amber-100 text-amber-800",
    bar: "bg-amber-500",
    text: "text-amber-600",
  },
  poor: {
    badge: "bg-orange-100 text-orange-800",
    bar: "bg-orange-500",
    text: "text-orange-600",
  },
  critical: {
    badge: "bg-red-100 text-red-800",
    bar: "bg-red-500",
    text: "text-red-600",
  },
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

  useEffect(() => {
    async function fetchRecommendations() {
      try {
        setIsLoadingRecs(true);
        const res = await fetch("/api/daily-recommendations");

        if (res.status === 404) {
          router.push("/onboarding");
          return;
        }

        if (res.ok) {
          const data = await res.json();
          setBlockRecs(data.blocks ?? []);
          setSummary(data.summary ?? null);
        }
      } catch (e) {
        console.error("Failed to fetch recommendations", e);
      } finally {
        setIsLoadingRecs(false);
      }
    }
    fetchRecommendations();
  }, [router]);

  const topAlert = summary?.alerts?.[0];
  const farmScore = summary?.farmHealthScore ?? 78;

  return (
    <AppShell>
      <div className="space-y-6">
        <AppPageHeader />

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
            <p className="text-xs text-slate-600 mt-3 font-medium">
              {summary?.blockCount
                ? `Average health across ${summary.blockCount} block${summary.blockCount > 1 ? "s" : ""}.`
                : "Your farm overview based on soil sensors."}
            </p>
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
                    <p className="text-xs text-slate-600 mt-2 font-medium line-clamp-3">{topAlert.message}</p>
                  </>
                ) : (
                  <p className="text-xs text-slate-600 mt-2 font-medium">No critical alerts today.</p>
                )}
                <Link
                  href="/farm"
                  className="inline-block mt-3 text-xs font-bold text-red-600 hover:text-red-700"
                >
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
                <Link
                  href="/farm"
                  className="inline-block mt-3 text-xs font-bold text-amber-700 hover:text-amber-800"
                >
                  Open Farm Twin →
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800">Daily Recommendations by Block</h3>
              <Link href="/farm" className="text-xs font-bold text-emerald-600 hover:underline">
                Farm map
              </Link>
            </div>

            <div className="space-y-4 max-h-[520px] overflow-y-auto pr-1">
              {isLoadingRecs ? (
                Array(3)
                  .fill(0)
                  .map((_, i) => (
                    <div key={i} className="rounded-xl border border-slate-100 p-4 animate-pulse">
                      <div className="h-4 bg-slate-100 rounded w-1/3 mb-3" />
                      <div className="h-3 bg-slate-100 rounded w-full mb-2" />
                      <div className="h-3 bg-slate-100 rounded w-2/3" />
                    </div>
                  ))
              ) : blockRecs.length > 0 ? (
                blockRecs.map((block) => {
                  const style = healthStyles[block.healthStatus];
                  return (
                    <article
                      key={block.blockId}
                      className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 hover:border-emerald-200 transition-colors"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                        <div>
                          <h4 className="font-bold text-slate-800 flex items-center gap-2">
                            <Leaf className="h-4 w-4 text-emerald-600" />
                            {block.blockName}
                          </h4>
                          {block.currentCrop && (
                            <p className="text-xs text-slate-500 mt-0.5">
                              Current crop: <span className="font-semibold text-slate-700">{block.currentCrop}</span>
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <span className={`text-lg font-bold ${style.text}`}>{block.healthScore}%</span>
                          <span
                            className={`ml-2 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${style.badge}`}
                          >
                            {healthLabel(block.healthStatus)}
                          </span>
                        </div>
                      </div>

                      <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden mb-3">
                        <div
                          className={`h-full rounded-full ${style.bar}`}
                          style={{ width: `${block.healthScore}%` }}
                        />
                      </div>

                      <p className="text-sm text-slate-600 leading-relaxed mb-3">{block.healthSummary}</p>

                      <div className="flex flex-wrap gap-2 mb-3 text-[11px] font-medium text-slate-600">
                        {block.soilMetrics.moisture != null && (
                          <span className="inline-flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2 py-1">
                            <Droplets className="h-3 w-3 text-sky-500" />
                            {block.soilMetrics.moisture}% moisture
                          </span>
                        )}
                        {block.soilMetrics.temp != null && (
                          <span className="inline-flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2 py-1">
                            <Thermometer className="h-3 w-3 text-orange-500" />
                            {block.soilMetrics.temp}°C
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2 py-1">
                          <FlaskConical className="h-3 w-3 text-violet-500" />
                          NPK {block.soilMetrics.nitrogen}/{block.soilMetrics.phosphorus}/
                          {block.soilMetrics.potassium}
                        </span>
                      </div>

                      {block.actions.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs font-bold text-slate-700 mb-1.5">Today&apos;s actions</p>
                          <ul className="space-y-1.5">
                            {block.actions.map((action, i) => (
                              <li
                                key={i}
                                className="text-sm text-slate-700 flex items-start gap-2"
                              >
                                <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                {action}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {block.suitableCrops.length > 0 && (
                        <div className="rounded-lg bg-emerald-50/80 border border-emerald-100 p-3">
                          <p className="text-xs font-bold text-emerald-800 mb-2 flex items-center gap-1">
                            <Sprout className="h-3.5 w-3.5" />
                            Best crops for this soil
                          </p>
                          <ul className="space-y-2">
                            {block.suitableCrops.map((crop) => (
                              <li key={crop.name} className="text-sm">
                                <span className="font-semibold text-slate-800">{crop.name}</span>
                                <span className="text-emerald-700 text-xs font-bold ml-2">
                                  {crop.score}% match
                                </span>
                                <p className="text-xs text-slate-600 mt-0.5 leading-snug">{crop.reason}</p>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </article>
                  );
                })
              ) : (
                <p className="text-sm text-slate-500 italic py-8 text-center">
                  No blocks found. Complete farm setup to get daily advice.
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-2 mt-5 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => speakText(recommendationsToSpeechText(blockRecs))}
                disabled={isLoadingRecs || blockRecs.length === 0}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors"
              >
                <Play className="h-4 w-4 fill-current" />
                Listen to Advice
              </button>
              <button
                type="button"
                onClick={toggleChat}
                className="border-2 border-emerald-600 text-emerald-700 hover:bg-emerald-50 px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors"
              >
                <Mic className="h-4 w-4" />
                Ask AgriTwin
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-800">Soil & Sensors</h3>
                <Link href="/farm" className="text-xs font-bold text-emerald-600 hover:underline">
                  View all
                </Link>
              </div>
              <div className="space-y-4">
                {isLoadingRecs ? (
                  Array(3)
                    .fill(0)
                    .map((_, i) => (
                      <div key={i} className="h-10 bg-slate-100 rounded animate-pulse" />
                    ))
                ) : (
                  blockRecs.map((block) => {
                    const m = block.soilMetrics.moisture ?? 0;
                    const barColor =
                      m < 35 ? "bg-orange-500" : m > 75 ? "bg-amber-400" : "bg-emerald-500";
                    return (
                      <div key={block.blockId}>
                        <div className="flex items-center justify-between text-sm font-semibold text-slate-700 mb-1.5">
                          <span className="flex items-center gap-2">
                            <Droplets className="h-4 w-4 text-sky-500" />
                            {block.blockName}
                          </span>
                          <span className="text-slate-500 font-medium text-xs">
                            {block.soilMetrics.moisture != null
                              ? `${block.soilMetrics.moisture}%`
                              : "No data"}
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${barColor}`}
                            style={{ width: `${Math.min(100, m)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-800">Today&apos;s Tasks</h3>
                <Link href="/tasks" className="text-xs font-bold text-emerald-600 hover:underline">
                  View all
                </Link>
              </div>
              <div className="space-y-3">
                {[
                  { who: "John", task: "Watered Maize", done: true },
                  { who: "Lewis", task: "Fertilize Tomatoes", done: false },
                  { who: "Victor", task: "Spray Beans", done: false },
                ].map((t) => (
                  <div key={t.who} className="flex items-center gap-3">
                    <div
                      className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        t.done ? "bg-emerald-500 border-emerald-500" : "border-slate-300 bg-white"
                      }`}
                    >
                      {t.done && <CheckCircle className="h-3 w-3 text-white" />}
                    </div>
                    <p className="text-sm text-slate-700">
                      <span className="font-bold text-slate-800">{t.who}</span> - {t.task}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-12 gap-4">
          <div className="xl:col-span-8">
            <FarmMapWidget />
          </div>
          <div className="xl:col-span-4 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col">
            <h3 className="font-bold text-slate-800 mb-4">Market Prices</h3>
            <div className="space-y-3 flex-1">
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <span className="text-lg">🌽</span> Maize
                </span>
                <span className="text-sm font-semibold text-slate-600 flex items-center gap-1">
                  KES 3,900 <TrendingUp className="h-4 w-4 text-emerald-500" />
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <span className="text-lg">🫘</span> Beans
                </span>
                <span className="text-sm font-semibold text-slate-600 flex items-center gap-1">
                  KES 7,200 <TrendingUp className="h-4 w-4 text-emerald-500" />
                </span>
              </div>
              <div className="pt-2">
                <p className="text-xs font-semibold text-slate-500 mb-2">Profit Forecast</p>
                <p className="text-2xl font-bold text-emerald-600">+12%</p>
                <div className="mt-3 h-16 w-full rounded-lg bg-gradient-to-t from-emerald-50 to-transparent relative overflow-hidden">
                  <svg
                    className="absolute bottom-0 left-0 right-0 h-12 w-full text-emerald-400"
                    viewBox="0 0 100 40"
                    preserveAspectRatio="none"
                  >
                    <path
                      d="M0,40 L15,32 L35,28 L55,18 L75,22 L100,8 L100,40 Z"
                      fill="currentColor"
                      fillOpacity="0.25"
                    />
                    <path
                      d="M0,40 L15,32 L35,28 L55,18 L75,22 L100,8"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                  </svg>
                </div>
              </div>
            </div>
            <Link
              href="/market"
              className="mt-4 w-full bg-slate-800 hover:bg-slate-900 text-white rounded-xl py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors"
            >
              <Lock className="h-4 w-4 text-amber-400" />
              Unlock Market Data
            </Link>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
            <h3 className="font-bold text-slate-800 text-sm mb-4">Crop Health Scans</h3>
            <div className="space-y-3">
              <div className="flex gap-3 items-center">
                <div className="h-14 w-20 rounded-lg overflow-hidden relative bg-slate-100 shrink-0 border border-slate-200">
                  <Image src="/community-farm.jpeg" alt="Beans scan" fill className="object-cover" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">Beans</p>
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                    Medium Risk
                  </span>
                </div>
              </div>
              <div className="flex gap-3 items-center">
                <div className="h-14 w-20 rounded-lg overflow-hidden relative bg-slate-100 shrink-0 border border-slate-200">
                  <Image src="/community-farm.jpeg" alt="Tomatoes scan" fill className="object-cover" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">Tomatoes</p>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    No issues
                  </span>
                </div>
              </div>
            </div>
            <Link
              href="/scan"
              className="inline-block mt-4 text-xs font-bold text-emerald-600 hover:underline"
            >
              View all scans →
            </Link>
          </div>

          <button
            type="button"
            onClick={toggleChat}
            className="bg-gradient-to-br from-slate-800 to-emerald-950 rounded-2xl p-6 border border-slate-700 shadow-lg flex flex-col items-center justify-center text-center min-h-[180px] hover:scale-[1.01] transition-transform group"
          >
            <div className="h-16 w-16 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/40 mb-4 group-hover:scale-105 transition-transform">
              <Mic className="h-8 w-8 text-white" />
            </div>
            <p className="font-bold text-white text-lg">Tap to Talk to AgriTwin</p>
          </button>

          <div className="bg-gradient-to-br from-sky-50 to-slate-50 rounded-2xl border border-slate-200/80 p-5 shadow-sm relative overflow-hidden min-h-[180px] flex flex-col justify-center">
            <p className="text-sm font-medium text-slate-600 italic leading-relaxed pr-16 relative z-10">
              &ldquo;Small steps today lead to a healthier harvest tomorrow.&rdquo;
            </p>
            <Sprout className="absolute bottom-3 right-3 h-16 w-16 text-emerald-200/80" />
          </div>
        </section>
      </div>
    </AppShell>
  );
}
