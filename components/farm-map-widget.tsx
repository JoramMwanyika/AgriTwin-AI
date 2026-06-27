"use client";

import { useState, useEffect } from "react";
import { Play, Maximize2 } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const Farm3DView = dynamic(() => import("@/components/farm-3d-view"), { ssr: false });

type FarmBlock = {
    id: number | string;
    cropName: string;
    blockName: string;
    color: string;
    progress: number;
    gridPosition: {
        row: number;
        col: number;
        rowSpan: number;
        colSpan: number;
    };
    structure: 'field' | 'barn' | 'house' | 'greenhouse' | 'irrigation' | 'storage';
    sensorData?: {
        soilMoisture: number;
        temperature: number;
        humidity: number;
    };
    healthStatus?: 'healthy' | 'warning' | 'critical';
    predictedHarvest?: Date;
};

const colorOptions = [
    {
        value: "primary",
        label: "Eco Green",
        bgClass: "bg-[#14532d] text-[#c0ff01]",
        borderClass: "border-[#14532d]",
        indicatorClass: "bg-[#c0ff01]"
    },
    {
        value: "yellow",
        label: "Golden Harvest",
        bgClass: "bg-amber-100 text-amber-900",
        borderClass: "border-amber-200",
        indicatorClass: "bg-amber-500"
    },
    {
        value: "brown",
        label: "Rich Soil",
        bgClass: "bg-[#3f2e18] text-[#f0efe9]", // Dark earthy brown
        borderClass: "border-[#3f2e18]",
        indicatorClass: "bg-[#d6cba8]"
    },
    {
        value: "lightgreen",
        label: "Fresh Sprout",
        bgClass: "bg-[#dcfce7] text-[#14532d]",
        borderClass: "border-[#86efac]",
        indicatorClass: "bg-[#22c55e]"
    },
    {
        value: "darkgreen",
        label: "Deep Forest",
        bgClass: "bg-[#0a1f16] text-white",
        borderClass: "border-[#0a1f16]",
        indicatorClass: "bg-[#4ade80]"
    },
];

const structureIcons: Record<string, string> = {
    field: "🌱",
    barn: "🏭",
    house: "🏡",
    greenhouse: "🌿",
    irrigation: "💧",
    storage: "📦",
};

export function FarmMapWidget() {
    const [farmBlocks, setFarmBlocks] = useState<FarmBlock[]>([]);
    const [is3DView, setIs3DView] = useState(false);
    const [conflictingBlockIds, setConflictingBlockIds] = useState<Set<string | number>>(new Set());

    useEffect(() => {
        loadFarmData();
    }, []);

    const loadFarmData = async () => {
        try {
            const response = await fetch('/api/farm');
            if (response.ok) {
                const farm = await response.json();
                if (farm.blocks) {
                    const mappedBlocks: FarmBlock[] = farm.blocks.map((b: any) => {
                        const grid = b.gridConfig || { row: 1, col: 1, rowSpan: 1, colSpan: 1, color: "primary" };
                        return {
                            id: b.id,
                            cropName: b.cropType || "Unknown",
                            blockName: b.name,
                            color: grid.color || "primary",
                            progress: 0,
                            gridPosition: {
                                row: grid.row || 1,
                                col: grid.col || 1,
                                rowSpan: grid.rowSpan || 1,
                                colSpan: grid.colSpan || 1
                            },
                            structure: (function () {
                                const combined = (b.name + " " + (b.cropType || "")).toLowerCase();
                                if (combined.includes('greenhouse') || combined.includes('nursery')) return 'greenhouse';
                                if (combined.includes('barn') || combined.includes('shed') || combined.includes('stable') || combined.includes('cow')) return 'barn';
                                if (combined.includes('water') || combined.includes('tank') || combined.includes('pump') || combined.includes('irrigation')) return 'irrigation';
                                if (combined.includes('storage') || combined.includes('silo') || combined.includes('warehouse')) return 'storage';
                                if (combined.includes('house') || combined.includes('home') || combined.includes('villa')) return 'house';
                                return 'field';
                            })(),
                            sensorData: b.readings?.[0] ? {
                                soilMoisture: b.readings[0].moisture || 0,
                                temperature: b.readings[0].temp || 0,
                                humidity: b.readings[0].humidity || 0
                            } : undefined,
                            healthStatus: 'healthy',
                            predictedHarvest: b.predictedHarvest ? new Date(b.predictedHarvest) : undefined
                        };
                    });
                    setFarmBlocks(mappedBlocks);
                    
                    // Check conflicts
                    try {
                        const conflictRes = await fetch('/api/graph/crop-conflict', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ blocks: mappedBlocks })
                        });
                        if (conflictRes.ok) {
                            const data = await conflictRes.json();
                            if (data.conflictingBlockIds?.length > 0) {
                                setConflictingBlockIds(new Set(data.conflictingBlockIds));
                            }
                        }
                    } catch (err) {
                        console.error("Failed to fetch conflicts", err);
                    }
                }
            } else {
                toast.error("Failed to load map data");
            }
        } catch (error) {
            console.error("Failed to load farm widget data:", error);
        }
    };

    const getColorClasses = (colorValue: string) => {
        return colorOptions.find((c) => c.value === colorValue) || colorOptions[0];
    };

    return (
        <div className="bg-white rounded-2xl p-5 md:p-6 border border-slate-200/80 shadow-sm relative h-full">
            <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
                <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-800 text-lg">Your Farm Twin</h3>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                        Live
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center bg-slate-100 p-1 rounded-lg">
                        <button
                            onClick={() => setIs3DView(false)}
                            className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${!is3DView ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            2D Map
                        </button>
                        <button
                            onClick={() => setIs3DView(true)}
                            className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${is3DView ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            3D Sim
                        </button>
                    </div>
                    
                    <Link href="/farm">
                        <Button variant="outline" size="sm" className="h-[32px] text-xs font-semibold bg-white border-slate-200 hover:bg-slate-50 text-slate-700 rounded-md">
                            <Maximize2 className="h-3.5 w-3.5 mr-1.5 text-slate-500" />
                            Expand & Edit
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="relative w-full h-[320px] md:h-[400px] rounded-xl overflow-hidden bg-gradient-to-b from-sky-50 to-emerald-50/30 border border-slate-200">
                {is3DView ? (
                    <div className="w-full h-full">
                        <Farm3DView blocks={farmBlocks} onBlockClick={(b) => toast.info(`Selected: ${b.blockName}`)} conflictingBlockIds={conflictingBlockIds} />
                    </div>
                ) : (
                    <div className="relative z-10 p-4 h-full bg-[url('/bg_mesh.png')] bg-cover bg-center overflow-auto">
                        <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#000_1px,transparent_1px),linear-gradient(to_bottom,#000_1px,transparent_1px)] bg-[size:40px_40px]"></div>

                        <div className="grid grid-cols-5 grid-rows-4 gap-3 max-w-full h-full min-w-[500px]">
                            <AnimatePresence>
                                {farmBlocks.map((block) => {
                                    const colors = getColorClasses(block.color);
                                    const icon = structureIcons[block.structure] || "🌱";
                                    const isConflicting = conflictingBlockIds.has(block.id);
                                    return (
                                        <motion.div
                                            layout
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            key={block.id}
                                            className={`${colors.bgClass} rounded-2xl border ${isConflicting ? 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)] animate-[conflict-blink_1s_ease-in-out_infinite]' : colors.borderClass} p-3 flex flex-col items-start justify-between relative group hover:-translate-y-1 transition-transform`}
                                            style={{
                                                gridRow: `${block.gridPosition.row} / span ${block.gridPosition.rowSpan}`,
                                                gridColumn: `${block.gridPosition.col} / span ${block.gridPosition.colSpan}`,
                                            }}
                                        >
                                            <div className="flex justify-between w-full items-start">
                                                <div className={`h-2 w-2 rounded-full ${isConflicting ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,1)]' : colors.indicatorClass} animate-pulse`} />
                                                {isConflicting ? (
                                                    <div className="bg-red-500 text-white text-[10px] px-1.5 rounded-full font-bold animate-pulse">⚠</div>
                                                ) : block.healthStatus === 'warning' && (
                                                    <div className="bg-red-500 text-white text-[10px] px-1.5 rounded-full font-bold animate-pulse">!</div>
                                                )}
                                            </div>

                                            <div className="mt-auto">
                                                <div className="text-xl mb-1">{icon}</div>
                                                <p className="font-serif font-bold text-sm leading-none">{block.cropName}</p>
                                                <p className="text-[10px] uppercase tracking-wider opacity-70 mt-1 font-medium">{block.blockName}</p>
                                            </div>

                                            {/* Interactive Overlay */}
                                            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm rounded-2xl p-3 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-center text-white z-10 pointer-events-none">
                                                <p className="text-[10px] font-bold text-green-400 uppercase tracking-wider mb-2">Status</p>
                                                {block.sensorData ? (
                                                    <div className="space-y-1 text-xs">
                                                        <div className="flex justify-between border-b border-white/20 pb-0.5">
                                                            <span className="text-gray-400">Moisture</span>
                                                            <span>{block.sensorData.soilMoisture}%</span>
                                                        </div>
                                                        <div className="flex justify-between border-b border-white/20 pb-0.5">
                                                            <span className="text-gray-400">Temp</span>
                                                            <span>{block.sensorData.temperature}°C</span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <p className="text-xs text-gray-400">No sensor data</p>
                                                )}
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
