"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Droplet, ThermometerSun, Wifi, ShieldAlert, CloudRain, Sun, Wind, CheckCircle2 } from "lucide-react";

type FarmBlock = {
    id: number | string;
    cropName: string;
    blockName: string;
    color: string;
    progress: number;
    structure: string;
    sensorData?: {
        soilMoisture: number;
        temperature: number;
        humidity: number;
    };
    healthStatus?: 'healthy' | 'warning' | 'critical';
};

type Farm25DViewProps = {
    blocks: FarmBlock[];
    onBlockClick: (block: FarmBlock) => void;
};

// Map structures to approximate percentage positions on the image (Top/Left)
const markerPositions: Record<string, { top: string; left: string; icon: React.ReactNode; color: string }> = {
    greenhouse: { top: "45%", left: "30%", icon: <Droplet className="w-4 h-4" />, color: "from-cyan-400 to-blue-600" },
    house: { top: "30%", left: "65%", icon: <Wifi className="w-4 h-4" />, color: "from-emerald-400 to-green-600" },
    storage: { top: "25%", left: "45%", icon: <ShieldAlert className="w-4 h-4" />, color: "from-blue-400 to-indigo-600" },
    irrigation: { top: "60%", left: "55%", icon: <CloudRain className="w-4 h-4" />, color: "from-sky-400 to-blue-500" },
    field: { top: "50%", left: "75%", icon: <Sun className="w-4 h-4" />, color: "from-green-400 to-emerald-600" },
    barn: { top: "55%", left: "85%", icon: <Wind className="w-4 h-4" />, color: "from-amber-400 to-orange-600" },
};

// Fallback positions for multiple fields/unknowns
const fallbackPositions = [
    { top: "65%", left: "40%" },
    { top: "75%", left: "60%" },
    { top: "40%", left: "80%" },
    { top: "80%", left: "30%" },
];

export default function Farm25DView({ blocks, onBlockClick }: Farm25DViewProps) {
    const [hoveredBlock, setHoveredBlock] = useState<FarmBlock | null>(null);

    // Filter to ensure we have positions for all blocks
    const positionedBlocks = blocks.map((block, index) => {
        const pos = markerPositions[block.structure] || markerPositions['field'];
        // Give variation if multiple fields
        if (block.structure === 'field' && index < fallbackPositions.length) {
            return { ...block, pos: fallbackPositions[index] };
        }
        return { ...block, pos: { top: pos.top, left: pos.left } };
    });

    return (
        <div className="w-full h-[600px] bg-[#020617] rounded-3xl overflow-hidden relative shadow-2xl font-sans group">
            {/* The 2.5D Isometric Background Image */}
            <div className="absolute inset-0 w-full h-full overflow-hidden">
                <img 
                    src="/isometric_smart_farm.png" 
                    alt="Farm 3D Map" 
                    className="w-full h-full object-cover opacity-90 transition-transform duration-1000 group-hover:scale-105"
                />
                {/* Tech Vignette Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-transparent to-[#020617]/30 pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#020617]/80 via-transparent to-[#020617]/80 pointer-events-none" />
            </div>

            {/* Glowing Map Markers */}
            {positionedBlocks.map((block, i) => {
                const markerTheme = markerPositions[block.structure] || markerPositions['field'];
                const isHovered = hoveredBlock?.id === block.id;

                return (
                    <motion.div
                        key={block.id}
                        className="absolute z-20 cursor-pointer"
                        style={{ top: block.pos.top, left: block.pos.left }}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        onMouseEnter={() => setHoveredBlock(block)}
                        onMouseLeave={() => setHoveredBlock(null)}
                        onClick={() => onBlockClick(block)}
                    >
                        {/* Connecting Line to ground */}
                        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-0.5 h-16 bg-gradient-to-b from-cyan-400 to-transparent opacity-50" />
                        
                        {/* Pulse Ring */}
                        <div className="absolute inset-0 -m-3 border border-cyan-400/50 rounded-full animate-ping opacity-75" />

                        {/* Icon Pin */}
                        <div className={`relative flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br ${markerTheme.color} shadow-[0_0_20px_rgba(34,211,238,0.4)] border-2 border-[#020617] transform transition-transform hover:scale-110`}>
                            {markerTheme.icon}
                        </div>

                        {/* Hover Popup Card */}
                        <AnimatePresence>
                            {isHovered && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9, y: 10 }}
                                    className="absolute bottom-14 left-1/2 -translate-x-1/2 w-48 bg-[#0f172a]/95 backdrop-blur-xl border border-cyan-500/30 rounded-xl p-3 shadow-2xl pointer-events-none"
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className={`w-2 h-2 rounded-full ${block.healthStatus === 'warning' ? 'bg-amber-500 animate-pulse' : 'bg-emerald-400'}`} />
                                        <h4 className="text-white text-xs font-bold uppercase tracking-wider">{block.blockName}</h4>
                                    </div>
                                    <p className="text-cyan-100 text-[10px] mb-3">{block.cropName}</p>
                                    
                                    {block.sensorData && (
                                        <div className="space-y-1.5">
                                            <div className="flex justify-between text-[10px]">
                                                <span className="text-slate-400 flex items-center gap-1"><Droplet className="w-3 h-3 text-blue-400" /> Moist</span>
                                                <span className="text-white font-mono">{block.sensorData.soilMoisture}%</span>
                                            </div>
                                            <div className="flex justify-between text-[10px]">
                                                <span className="text-slate-400 flex items-center gap-1"><ThermometerSun className="w-3 h-3 text-orange-400" /> Temp</span>
                                                <span className="text-white font-mono">{block.sensorData.temperature}°C</span>
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                );
            })}

            {/* Static UI Overlays (Glassmorphism Panes) */}
            
            {/* Top Left: Farm Overview */}
            <div className="absolute top-6 left-6 w-64 bg-[#0f172a]/70 backdrop-blur-md border border-slate-700/50 rounded-2xl p-4 shadow-2xl hidden md:block">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-white font-bold text-sm">Farm Overview</h3>
                    <span className="bg-emerald-500/20 text-emerald-400 text-[10px] px-2 py-0.5 rounded-full font-bold">Good</span>
                </div>
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 rounded-full border-4 border-emerald-500 flex items-center justify-center">
                        <span className="text-white font-bold text-lg">78%</span>
                    </div>
                    <div>
                        <p className="text-slate-400 text-xs">Farm Health</p>
                        <p className="text-emerald-400 text-[10px] flex items-center gap-1 mt-1">
                            <CheckCircle2 className="w-3 h-3" /> All systems nominal
                        </p>
                    </div>
                </div>
            </div>

            {/* Top Right: Weather Panel */}
            <div className="absolute top-6 right-6 w-56 bg-[#0f172a]/70 backdrop-blur-md border border-slate-700/50 rounded-2xl p-4 shadow-2xl hidden md:block">
                <div className="flex items-start justify-between mb-2">
                    <div>
                        <h3 className="text-white font-bold text-sm">Weather</h3>
                        <p className="text-slate-400 text-[10px]">Nairobi, KE</p>
                    </div>
                    <CloudRain className="text-blue-400 w-6 h-6" />
                </div>
                <p className="text-white text-3xl font-light mb-1">24°C</p>
                <p className="text-blue-400 text-xs mb-3">Rain 40% chance</p>
                <div className="grid grid-cols-3 gap-2 border-t border-slate-700/50 pt-3">
                    <div className="text-center">
                        <Wind className="w-3 h-3 text-slate-400 mx-auto mb-1" />
                        <p className="text-white text-[10px]">8 km/h</p>
                    </div>
                    <div className="text-center">
                        <Droplet className="w-3 h-3 text-slate-400 mx-auto mb-1" />
                        <p className="text-white text-[10px]">68%</p>
                    </div>
                    <div className="text-center">
                        <Sun className="w-3 h-3 text-slate-400 mx-auto mb-1" />
                        <p className="text-white text-[10px]">UV 3</p>
                    </div>
                </div>
            </div>

            {/* Bottom Right: Active Sensors List */}
            <div className="absolute bottom-6 right-6 w-64 bg-[#0f172a]/80 backdrop-blur-xl border border-cyan-500/20 rounded-2xl p-4 shadow-[0_0_30px_rgba(6,182,212,0.15)] hidden md:block">
                <h3 className="text-white font-bold text-xs flex items-center gap-2 mb-3">
                    <Wifi className="w-3 h-3 text-cyan-400" /> Active Sensors
                </h3>
                <div className="space-y-3">
                    {blocks.slice(0, 3).map((block, i) => (
                        <div key={block.id} className="flex justify-between items-center text-[10px]">
                            <div className="flex items-center gap-2">
                                <span className="text-emerald-400">●</span>
                                <span className="text-slate-300">{block.blockName}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-slate-500">Moisture</span>
                                <span className="text-white font-mono">{block.sensorData?.soilMoisture || 65}%</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Bottom Left: Global Metrics */}
            <div className="absolute bottom-6 left-6 flex gap-3 hidden md:flex">
                <div className="bg-[#0f172a]/70 backdrop-blur-md border border-slate-700/50 rounded-xl px-4 py-2 flex items-center gap-3">
                    <div className="p-1.5 bg-emerald-500/20 rounded-lg">
                        <Droplet className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                        <p className="text-slate-400 text-[9px] uppercase tracking-wider">Acres Monitored</p>
                        <p className="text-white font-bold text-sm">25K+</p>
                    </div>
                </div>
                <div className="bg-[#0f172a]/70 backdrop-blur-md border border-slate-700/50 rounded-xl px-4 py-2 flex items-center gap-3">
                    <div className="p-1.5 bg-cyan-500/20 rounded-lg">
                        <Wifi className="w-4 h-4 text-cyan-400" />
                    </div>
                    <div>
                        <p className="text-slate-400 text-[9px] uppercase tracking-wider">Devices Online</p>
                        <p className="text-white font-bold text-sm">45</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
