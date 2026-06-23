"use client";

import { useState, useEffect } from "react";
import { AppShell } from "@/components/app-shell";
import { AppPageHeader } from "@/components/app-page-header";
import { Network, Database, RefreshCw, AlertTriangle, ShieldCheck, Truck, ShoppingCart } from "lucide-react";

type GraphData = any[];

export default function NetworkPage() {
    const [viewMode, setViewMode] = useState<"knowledge" | "supply">("knowledge");
    const [data, setData] = useState<GraphData>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSeeding, setIsSeeding] = useState(false);

    useEffect(() => {
        fetchGraphData(viewMode);
    }, [viewMode]);

    async function fetchGraphData(type: "knowledge" | "supply") {
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/graph?type=${type}`);
            const json = await res.json();
            
            if (!res.ok) {
                throw new Error(json.details || json.error || "Failed to fetch graph data");
            }
            
            setData(json.data || []);
        } catch (err: any) {
            console.error("Graph Error:", err);
            setError(err.message || "Failed to connect to Neo4j database.");
        } finally {
            setIsLoading(false);
        }
    }

    async function handleSeedDatabase() {
        setIsSeeding(true);
        setError(null);
        try {
            const res = await fetch("/api/neo4j/seed", { method: "POST" });
            const json = await res.json();
            if (!res.ok) throw new Error(json.details || json.error || "Failed to seed database");
            
            // Reload data
            fetchGraphData(viewMode);
        } catch (err: any) {
            setError(err.message || "Failed to seed database");
        } finally {
            setIsSeeding(false);
        }
    }

    return (
        <AppShell>
            <div className="space-y-6">
                <AppPageHeader />

                <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <Network className="h-5 w-5 text-emerald-600" />
                            AgriTwin Graph Network
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">
                            Powered by Neo4j. Visualize complex agricultural relationships.
                        </p>
                    </div>
                    
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="bg-slate-100 p-1 rounded-xl flex">
                            <button
                                onClick={() => setViewMode("knowledge")}
                                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${viewMode === 'knowledge' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Crop Knowledge
                            </button>
                            <button
                                onClick={() => setViewMode("supply")}
                                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${viewMode === 'supply' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Supply Chain
                            </button>
                        </div>
                        <button 
                            onClick={handleSeedDatabase}
                            disabled={isSeeding}
                            className="bg-slate-800 hover:bg-slate-900 disabled:bg-slate-400 text-white p-2.5 rounded-xl shadow-sm transition-colors flex items-center gap-2"
                            title="Reset and Seed Neo4j Database"
                        >
                            <Database className="h-4 w-4" />
                            <span className="sr-only md:not-sr-only text-sm font-semibold pr-2">
                                {isSeeding ? "Seeding..." : "Seed DB"}
                            </span>
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                        <div>
                            <p className="font-bold">Neo4j Connection Error</p>
                            <p className="text-sm mt-1">{error}</p>
                            <p className="text-xs mt-2 text-red-600 font-semibold">Make sure NEO4J_URI, NEO4J_USER, and NEO4J_PASSWORD are set in your .env.local file!</p>
                        </div>
                    </div>
                )}

                {!error && isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                        <RefreshCw className="h-8 w-8 animate-spin mb-4 text-emerald-500" />
                        <p className="font-semibold text-slate-600">Querying Neo4j Graph Database...</p>
                    </div>
                ) : !error && data.length === 0 ? (
                    <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center shadow-sm">
                        <Database className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-slate-800">No Graph Data Found</h3>
                        <p className="text-slate-500 mt-2 max-w-md mx-auto">
                            The Neo4j database connected successfully, but no nodes were returned. Click "Seed DB" above to inject the demo data!
                        </p>
                    </div>
                ) : !error && viewMode === "knowledge" ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {data.map((item, idx) => (
                            <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 bg-emerald-100 rounded-full flex items-center justify-center shrink-0 border border-emerald-200">
                                        <span className="text-emerald-700 font-bold text-xs uppercase">{item.crop.substring(0,2)}</span>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 font-semibold">Crop</p>
                                        <p className="font-bold text-slate-800">{item.crop}</p>
                                    </div>
                                </div>
                                
                                <div className="flex flex-col items-center">
                                    <div className="w-0.5 h-6 bg-red-200"></div>
                                    <div className="text-[10px] bg-red-100 text-red-800 font-bold px-2 py-0.5 rounded-full z-10 my-[-10px] border border-white">
                                        VULNERABLE_TO
                                    </div>
                                    <div className="w-0.5 h-6 bg-red-200"></div>
                                </div>

                                <div className="bg-red-50 border border-red-100 p-3 rounded-xl flex items-center gap-3">
                                    <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
                                    <div>
                                        <p className="font-bold text-red-900">{item.disease}</p>
                                        <p className="text-[10px] uppercase font-bold text-red-600">{item.diseaseType}</p>
                                    </div>
                                </div>

                                <div className="flex flex-col items-center">
                                    <div className="w-0.5 h-6 bg-sky-200"></div>
                                    <div className="text-[10px] bg-sky-100 text-sky-800 font-bold px-2 py-0.5 rounded-full z-10 my-[-10px] border border-white">
                                        TREATED_BY
                                    </div>
                                    <div className="w-0.5 h-6 bg-sky-200"></div>
                                </div>

                                <div className="bg-sky-50 border border-sky-100 p-3 rounded-xl flex items-center gap-3">
                                    <ShieldCheck className="h-5 w-5 text-sky-500 shrink-0" />
                                    <div>
                                        <p className="font-bold text-sky-900">{item.treatment}</p>
                                        <p className="text-[10px] uppercase font-bold text-sky-600">{item.treatmentMethod}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : !error && viewMode === "supply" ? (
                     <div className="grid grid-cols-1 gap-4">
                        {data.map((item, idx) => (
                            <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center gap-4 md:gap-0">
                                
                                <div className="flex-1 flex flex-col items-center text-center">
                                    <div className="h-12 w-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-2">
                                        🧑‍🌾
                                    </div>
                                    <p className="font-bold text-slate-800">{item.farmer}</p>
                                    <p className="text-xs text-slate-500 font-semibold">Producer</p>
                                </div>

                                <div className="flex-1 flex flex-col items-center justify-center px-4">
                                    <div className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full mb-1">
                                        SELLS_TO ({item.volumeTons} Tons {item.crop})
                                    </div>
                                    <div className="w-full h-0.5 bg-emerald-200 relative">
                                        <div className="absolute right-0 top-[-4px] w-0 h-0 border-t-4 border-t-transparent border-l-8 border-l-emerald-200 border-b-4 border-b-transparent"></div>
                                    </div>
                                </div>

                                <div className="flex-1 flex flex-col items-center text-center">
                                    <div className="h-12 w-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-2">
                                        <Truck className="h-5 w-5" />
                                    </div>
                                    <p className="font-bold text-slate-800">{item.distributor}</p>
                                    <p className="text-xs text-slate-500 font-semibold">Distributor</p>
                                </div>

                                <div className="flex-1 flex flex-col items-center justify-center px-4">
                                    <div className="text-[10px] font-bold text-sky-600 bg-sky-50 border border-sky-200 px-3 py-1 rounded-full mb-1">
                                        SUPPLIES_TO
                                    </div>
                                    <div className="w-full h-0.5 bg-sky-200 relative">
                                        <div className="absolute right-0 top-[-4px] w-0 h-0 border-t-4 border-t-transparent border-l-8 border-l-sky-200 border-b-4 border-b-transparent"></div>
                                    </div>
                                </div>

                                <div className="flex-1 flex flex-col items-center text-center">
                                    <div className="h-12 w-12 bg-violet-100 text-violet-600 rounded-full flex items-center justify-center mb-2">
                                        <ShoppingCart className="h-5 w-5" />
                                    </div>
                                    <p className="font-bold text-slate-800">{item.buyer}</p>
                                    <p className="text-xs text-slate-500 font-semibold">{item.buyerType}</p>
                                </div>

                            </div>
                        ))}
                    </div>
                ) : null}
            </div>
        </AppShell>
    );
}
