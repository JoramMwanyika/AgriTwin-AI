"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/header";
import { CloudRain, AlertTriangle, Calendar as CalendarIcon, Droplets, Leaf, Activity, Play, Mic, CheckCircle, TrendingUp, TrendingDown, Image as ImageIcon, MapPin, Thermometer, User, Lock } from "lucide-react";
import { useChat } from "@/components/chat-provider";
import { FarmMapWidget } from "@/components/farm-map-widget";
import { speakText } from "@/lib/speech";
import Image from "next/image";

export default function Dashboard() {
  const router = useRouter();
  const { toggleChat } = useChat();
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [isLoadingRecs, setIsLoadingRecs] = useState(true);

  useEffect(() => {
    async function fetchFarmData() {
      try {
        setIsLoadingRecs(true);
        const res = await fetch('/api/farm');

        if (res.status === 404) {
          router.push('/onboarding');
          return;
        }

        if (res.ok) {
          const data = await res.json();
          const recs: string[] = [];
          if (data.blocks && data.blocks.length > 0) {
            data.blocks.forEach((b: any) => {
              // Check Moisture
              if (b.readings?.[0]) {
                if (b.readings[0].moisture < 35) {
                  recs.push(`Water ${b.cropType || "crops"} in ${b.name}`);
                } else if (b.readings[0].moisture > 75) {
                  recs.push(`Delay irrigation in ${b.name}`);
                }

                if (b.readings[0].humidity > 65 && b.name.toLowerCase().includes("greenhouse")) {
                  recs.push(`Ventilate ${b.name} to reduce humidity`);
                }
              }

              // Simulated health condition strings from the AI backend or hardcoded mock rules
              if (b.name === "Block B" && (!b.readings || b.readings.length === 0)) {
                // Fallback for mocked warning if API doesn't return detailed issues
                recs.push(`Check beans for fungal spots in ${b.name}`);
              }
            });
          }

          if (recs.length === 0) {
            recs.push("Your farm is looking healthy today!");
            recs.push("Review crop market prices to plan your next harvest.");
          }

          // deduplicate and limit to top 3
          setRecommendations([...new Set(recs)].slice(0, 3));
        }
      } catch (e) {
        console.error("Failed to fetch farm data", e);
        setRecommendations(["Water maize in Block A", "Check beans for fungal spots", "Delay irrigation in Greenhouse"]);
      } finally {
        setIsLoadingRecs(false);
      }
    }
    fetchFarmData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-24">
      <Header />

      <main className="container mx-auto px-4 max-w-7xl py-6 space-y-6">

        {/* Top Overview Section */}
        <section>
          <h2 className="text-xl font-bold text-slate-800 mb-3">Today's Farm Overview</h2>
          <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4 flex items-center gap-4 text-slate-700 font-medium shadow-sm">
            <CloudRain className="h-6 w-6 text-blue-400" />
            <div className="flex gap-2 items-center">
              <span>Nairobi</span>
              <span className="text-slate-300">|</span>
              <span>24°C</span>
              <span className="text-slate-300">|</span>
              <span>Rain 40%</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Health Status */}
            <div className="bg-white rounded-xl border border-green-200/50 p-4 flex items-center gap-4 shadow-sm">
              <div className="h-10 w-10 rounded-full bg-green-500 flex items-center justify-center shrink-0">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
              <div>
                <span className="text-slate-600 font-medium">Farm Health: </span>
                <span className="text-green-600 font-bold text-xl">78% </span>
                <span className="text-green-600 font-medium">Good</span>
              </div>
            </div>

            {/* Alerts */}
            <div className="bg-red-50/50 rounded-xl border border-red-100 p-4 flex items-center gap-4 shadow-sm">
              <div className="h-10 w-10 rounded-full bg-red-500 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5 text-white" />
              </div>
              <div className="font-medium text-red-900">
                <span className="text-red-600 font-bold">Alert:</span> Block B - Low Moisture
              </div>
            </div>

            {/* Next Task */}
            <div className="bg-yellow-50/50 rounded-xl border border-yellow-100 p-4 flex items-center gap-4 shadow-sm">
              <div className="h-10 w-10 rounded-lg bg-yellow-100 flex items-center justify-center shrink-0 border border-yellow-200">
                <CalendarIcon className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <div className="font-bold text-slate-800 text-sm">Next Task: <span className="font-medium text-slate-600">Fertilize Tomatoes</span></div>
                <div className="text-xs text-slate-500 mt-0.5">at 2:00 PM</div>
              </div>
            </div>
          </div>
        </section>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Left/Center Column (Span 8) */}
          <div className="lg:col-span-8 space-y-6">

            {/* Daily Recommendations */}
            <div className="bg-white rounded-[20px] p-6 border border-slate-200 shadow-sm relative overflow-hidden">
              <h3 className="font-bold text-slate-800 text-lg mb-4">Daily Recommendations</h3>
              <ul className="space-y-4 mb-6 relative z-10 min-h-[140px]">
                {isLoadingRecs ? (
                  Array(3).fill(0).map((_, i) => (
                    <li key={i} className="flex items-start gap-3 text-slate-700 font-medium pb-4 border-b border-slate-100 last:border-0">
                      <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-slate-200 shrink-0" />
                      <div className="h-4 bg-slate-100 rounded w-3/4 animate-pulse" />
                    </li>
                  ))
                ) : recommendations.length > 0 ? (
                  recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-3 text-slate-700 font-medium pb-4 border-b border-slate-100 last:border-0 last:pb-0">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
                      {rec}
                    </li>
                  ))
                ) : (
                  <li className="flex items-start gap-3 text-slate-500 font-medium italic">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-slate-300 shrink-0" />
                    No urgent recommendations right now.
                  </li>
                )}
              </ul>
              <div className="flex gap-3 relative z-10 mt-4">
                <button
                  onClick={() => speakText(`Here are your daily recommendations: ${recommendations.join(". ")}`)}
                  disabled={isLoadingRecs || recommendations.length === 0}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-colors"
                >
                  <Play className="h-4 w-4 fill-current" />
                  Listen to Advice
                </button>
                <button onClick={toggleChat} className="bg-red-500 hover:bg-red-600 text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-colors shadow-sm shadow-red-500/20">
                  <Mic className="h-4 w-4" />
                  Ask AgriTwin
                </button>
              </div>
            </div>

            {/* Your Farm Twin Map */}
            {/* Your Farm Twin Map */}
            <FarmMapWidget />

            {/* Bottom Scans and Voice CTA */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Crop Health Scans Minis */}
              <div className="bg-white rounded-[20px] p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-slate-800 text-sm mb-4">Crop Health Scans</h3>
                  <div className="flex gap-4">
                    <div className="h-16 w-24 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 relative">
                      <Image src="/community-farm.jpeg" alt="Scan 1" layout="fill" objectFit="cover" />
                    </div>
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                        <Leaf className="h-4 w-4 text-green-500" />
                        Beans: <span className="font-bold">Fungal Risk</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                        <Leaf className="h-4 w-4 text-red-500" />
                        Tomatoes: <span className="text-slate-500 font-normal">Healthy</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tap to voice block */}
              <div
                onClick={toggleChat}
                className="bg-slate-800 hover:bg-slate-900 cursor-pointer rounded-[20px] p-5 border border-slate-700 shadow-lg flex items-center justify-center transition-transform hover:scale-[1.02] relative overflow-hidden group"
              >
                <div className="absolute -left-6 -bottom-6 bg-green-500/20 w-32 h-32 rounded-full blur-2xl group-hover:bg-green-500/30 transition-colors" />
                <div className="relative z-10 flex items-center gap-4 text-white">
                  <div className="h-12 w-12 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/20">
                    <Mic className="h-6 w-6 text-white" />
                  </div>
                  <span className="font-bold text-lg tracking-tight">Tap to Talk to AgriTwin</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (Span 4) */}
          <div className="lg:col-span-4 space-y-6">

            {/* Soil & Sensors */}
            <div className="bg-white rounded-[20px] p-6 border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-800 text-lg mb-4">Soil & Sensors</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                  <Droplets className="h-5 w-5 text-green-500" fill="currentColor" />
                  <div className="flex-1 font-medium text-slate-800 text-sm">
                    Block A: <span className="text-slate-500 font-normal">Moisture <span className="text-green-600 font-bold">65%</span></span>
                  </div>
                </div>
                <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                  <Droplets className="h-5 w-5 text-orange-500" fill="currentColor" />
                  <div className="flex-1 font-medium text-slate-800 text-sm">
                    Block B: <span className="text-slate-500 font-normal">Moisture <span className="text-orange-600 font-bold">25%</span></span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Droplets className="h-5 w-5 text-yellow-500" fill="currentColor" />
                  <div className="flex-1 font-medium text-slate-800 text-sm">
                    Greenhouse: <span className="text-slate-500 font-normal">Humidity <span className="text-yellow-600 font-bold">High</span></span>
                  </div>
                </div>
              </div>
            </div>

            {/* Today's Tasks */}
            <div className="bg-white rounded-[20px] p-6 border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-800 text-lg mb-4">Today's Tasks</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                  <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200 overflow-hidden">
                    <User className="h-4 w-4 text-slate-400" />
                  </div>
                  <div className="flex-1 text-sm text-slate-600">
                    <span className="font-bold text-slate-800">John</span> - Watered Maize
                  </div>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </div>
                <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                  <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200 overflow-hidden">
                    <User className="h-4 w-4 text-slate-400" />
                  </div>
                  <div className="flex-1 text-sm text-slate-600">
                    <span className="font-bold text-slate-800">Lewis</span> - Fertilize Tomatoes
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200 overflow-hidden">
                    <User className="h-4 w-4 text-slate-400" />
                  </div>
                  <div className="flex-1 text-sm text-slate-600">
                    <span className="font-bold text-slate-800">Victor</span> - Spray Beans
                  </div>
                </div>
              </div>
            </div>

            {/* Market Prices */}
            <div className="bg-white rounded-[20px] p-6 border border-slate-200 shadow-sm flex flex-col">
              <h3 className="font-bold text-slate-800 text-lg mb-4">Market Prices</h3>
              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                  <div className="h-6 w-6 rounded bg-yellow-100 flex items-center justify-center text-xs">🌽</div>
                  <div className="flex-1 text-sm font-bold text-slate-800">
                    Maize: <span className="text-slate-600 font-normal">KES 3,900 / Bag</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                  <div className="h-6 w-6 rounded bg-green-100 flex items-center justify-center text-xs">🫘</div>
                  <div className="flex-1 text-sm font-bold text-slate-800">
                    Beans: <span className="text-slate-600 font-normal">KES 7,200 / Bag</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  <div className="flex-1 text-sm font-bold text-slate-800">
                    Profit Forecast: <span className="text-green-600 font-bold">+12%</span>
                  </div>
                </div>
              </div>

              <button className="w-full bg-slate-800 hover:bg-slate-900 text-white rounded-xl py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors">
                <Lock className="h-4 w-4 text-yellow-500" />
                Unlock Market Data
              </button>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
