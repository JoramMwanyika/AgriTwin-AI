"use client";

import { useState, useEffect } from "react";
import { AppShell } from "@/components/app-shell";
import { AppPageHeader } from "@/components/app-page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Sprout,
  Plus,
  Pencil,
  Trash2,
  Mic,
  Calendar,
  MoreHorizontal,
  LayoutGrid,
  Droplets,
  Sun,
  Wind,
  Thermometer,
  ArrowUpRight
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";

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
  description?: string;
  sensorData?: {
    soilMoisture: number;
    temperature: number;
    humidity: number;
  };
  healthStatus?: 'healthy' | 'warning' | 'critical';
  predictedHarvest?: Date;
  voiceNotes?: Array<{
    id: string;
    timestamp: Date;
    duration: number;
    text: string;
  }>;
  photos?: Array<{
    id: string;
    url: string;
    timestamp: Date;
    // ...
  }>;
};

const colorOptions = [
  {
    value: "primary",
    label: "Eco Green",
    bgClass: "bg-[#14532d]/40 backdrop-blur-md text-[#4ade80]",
    borderClass: "border-[#22c55e]/30",
    indicatorClass: "bg-[#4ade80]"
  },
  {
    value: "yellow",
    label: "Golden Harvest",
    bgClass: "bg-amber-900/40 backdrop-blur-md text-amber-400",
    borderClass: "border-amber-500/30",
    indicatorClass: "bg-amber-400"
  },
  {
    value: "brown",
    label: "Rich Soil",
    bgClass: "bg-[#3f2e18]/40 backdrop-blur-md text-[#d6cba8]",
    borderClass: "border-[#854d0e]/30",
    indicatorClass: "bg-[#d6cba8]"
  },
  {
    value: "lightgreen",
    label: "Fresh Sprout",
    bgClass: "bg-[#064e3b]/40 backdrop-blur-md text-[#6ee7b7]",
    borderClass: "border-[#10b981]/30",
    indicatorClass: "bg-[#34d399]"
  },
  {
    value: "darkgreen",
    label: "Deep Forest",
    bgClass: "bg-[#022c22]/60 backdrop-blur-md text-[#a7f3d0]",
    borderClass: "border-[#047857]/30",
    indicatorClass: "bg-[#10b981]"
  },
];

const structureIcons = {
  field: "🌱",
  barn: "🏭",
  house: "🏡",
  greenhouse: "🌿",
  irrigation: "💧",
  storage: "📦",
};

import dynamic from "next/dynamic";

const Farm3DView = dynamic(() => import("@/components/farm-3d-view"), { ssr: false });

export default function FarmTwinPage() {
  const [farmBlocks, setFarmBlocks] = useState<FarmBlock[]>([]);
  const [farmLocation, setFarmLocation] = useState<string | null>(null);
  const [totalSize, setTotalSize] = useState<number>(0);

  const [is3DView, setIs3DView] = useState(false);

  const [isEditingLayout, setIsEditingLayout] = useState(false);
  const [editingBlock, setEditingBlock] = useState<FarmBlock | null>(null);
  const [newBlockName, setNewBlockName] = useState("");
  const [newCropName, setNewCropName] = useState("");
  const [newBlockColor, setNewBlockColor] = useState("primary");
  const [addBlockDialogOpen, setAddBlockDialogOpen] = useState(false);
  const [weather, setWeather] = useState<any>(null);

  useEffect(() => {
    loadFarmData();
  }, []);

  const loadFarmData = async () => {
    try {
      const response = await fetch('/api/farm');

      if (response.status === 404) {
        // No farm found, redirect to onboarding
        window.location.href = "/onboarding";
        return;
      }

      if (response.ok) {
        const farm = await response.json();
        setFarmLocation(farm.location);
        setTotalSize(farm.size);

        if (farm.blocks) {
          const mappedBlocks: FarmBlock[] = farm.blocks.map((b: any) => {
            // Default or stored grid config
            const grid = b.gridConfig || { row: 1, col: 1, rowSpan: 1, colSpan: 1, color: "primary" };

            return {
              id: b.id,
              cropName: b.cropType || "Unknown",
              blockName: b.name,
              color: grid.color || "primary",
              progress: 0, // Calculate based on planting date if available
              gridPosition: {
                row: grid.row || 1,
                col: grid.col || 1,
                rowSpan: grid.rowSpan || 1,
                colSpan: grid.colSpan || 1
              },
              structure: (function () {
                const combined = (b.name + " " + (b.cropType || "")).toLowerCase();
                if (combined.includes('greenhouse') || combined.includes('nursery') || combined.includes('tunnel')) return 'greenhouse';
                if (combined.includes('barn') || combined.includes('shed') || combined.includes('stable') || combined.includes('cow') || combined.includes('cattle') || combined.includes('livestock') || combined.includes('poultry') || combined.includes('chicken')) return 'barn';
                if (combined.includes('water') || combined.includes('tank') || combined.includes('pump') || combined.includes('well') || combined.includes('irrigation')) return 'irrigation';
                if (combined.includes('storage') || combined.includes('silo') || combined.includes('warehouse') || combined.includes('garage') || combined.includes('store')) return 'storage';
                if (combined.includes('house') || combined.includes('home') || combined.includes('villa') || combined.includes('cottage') || combined.includes('office')) return 'house';
                return 'field';
              })(),
              sensorData: b.readings?.[0] ? {
                soilMoisture: b.readings[0].moisture || 0,
                temperature: b.readings[0].temp || 0,
                humidity: b.readings[0].humidity || 0
              } : undefined,
              healthStatus: 'healthy', // derive from sensor logic later
            };
          });
          setFarmBlocks(mappedBlocks);
        }
      }

      // Load weather if location exists or default
      loadWeather();
    } catch (error) {
      console.error("Failed to load farm:", error);
    }
  };

  const loadWeather = async () => {
    try {
      const response = await fetch(`/api/weather?lat=-1.286389&lon=36.817223`);
      if (response.ok) {
        const data = await response.json();
        setWeather(data);
      }
    } catch (error) {
      console.error("Weather error:", error);
    }
  };

  const getColorClasses = (colorValue: string) => {
    return colorOptions.find((c) => c.value === colorValue) || colorOptions[0];
  };

  const handleAddBlock = () => {
    if (!newCropName.trim() || !newBlockName.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    const newBlock: FarmBlock = {
      id: Date.now(),
      cropName: newCropName,
      blockName: newBlockName,
      color: newBlockColor,
      progress: 0,
      gridPosition: { row: 4, col: 4, rowSpan: 1, colSpan: 1 },
      structure: 'field',
    };
    setFarmBlocks([...farmBlocks, newBlock]);
    setNewCropName("");
    setNewBlockName("");
    setNewBlockColor("primary");
    setAddBlockDialogOpen(false);
    toast.success(`${newBlockName} deployed!`);
  };

  const handleUpdateBlock = () => {
    if (!editingBlock) return;
    setFarmBlocks(
      farmBlocks.map((block) =>
        block.id === editingBlock.id ? editingBlock : block
      )
    );
    setEditingBlock(null);
    toast.success("Zone reconfigured!");
  };

  const handleDeleteBlock = (id: number | string) => {
    setFarmBlocks(farmBlocks.filter((block) => block.id !== id));
    toast.success("Zone removed!");
  };

  return (
    <AppShell footer={false}>
      <div className="space-y-8 max-w-7xl mx-auto w-full">
        <AppPageHeader subtitle="Manage zones, sensors, and your digital twin" />

        {/* Hero Section */}
        <section className="rounded-2xl bg-white border border-slate-200/80 p-6 md:p-8 shadow-sm relative overflow-hidden group">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-emerald-100/60 rounded-full blur-[80px] -mr-32 -mt-32 pointer-events-none" />

          <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-5">
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 backdrop-blur-md border border-white/10 w-fit shadow-inner"
              >
                <div className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22c55e] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-[#22c55e]"></span>
                </div>
                <span className="text-xs font-bold tracking-widest uppercase text-slate-300">Twin Synced</span>
              </motion.div>
              
              <motion.h2 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-4xl md:text-5xl font-serif font-medium text-white leading-tight"
              >
                Farm Status: <span className="text-[#22c55e]">Optimal</span>
              </motion.h2>
              
              <motion.p 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-slate-400 max-w-2xl text-base leading-relaxed"
              >
                Your digital farm twin is fully synchronized with live IoT sensors. AI analysis predicts a <span className="text-white font-medium bg-white/10 px-2 py-0.5 rounded-md border border-white/5">12% yield increase</span> this season based on current growth velocity.
              </motion.p>
            </div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap gap-4"
            >
              <Button
                onClick={() => setIs3DView(!is3DView)}
                variant="outline"
                className={`transition-all duration-300 rounded-full px-6 h-12 bg-[#0f172a]/50 backdrop-blur-md border-slate-600 text-slate-300 hover:text-white hover:bg-slate-700/80 hover:border-slate-500 ${is3DView ? 'ring-2 ring-blue-500/50 bg-blue-500/20 text-white border-blue-500/30' : ''}`}
              >
                <span className="mr-2 opacity-70">Deployment:</span>
                <strong className="text-white">{is3DView ? '3D Render' : '2D Map'}</strong>
              </Button>

              <Button
                onClick={() => setIsEditingLayout(!isEditingLayout)}
                disabled={is3DView}
                variant="outline"
                className={`transition-all duration-300 rounded-full px-6 h-12 bg-[#0f172a]/50 backdrop-blur-md border-slate-600 text-slate-300 hover:text-white hover:bg-slate-700/80 hover:border-slate-500 ${isEditingLayout ? 'ring-2 ring-[#22c55e]/50 bg-[#22c55e]/20 text-white border-[#22c55e]/50' : ''}`}
              >
                <LayoutGrid className="h-4 w-4 mr-2" />
                {isEditingLayout ? 'Lock Grid' : 'Edit Grid'}
              </Button>

              <Button className="rounded-full px-8 h-12 bg-[#22c55e] hover:bg-[#16a34a] text-white font-bold shadow-lg shadow-[#22c55e]/20 border-0 hover:scale-105 transition-all">
                <ArrowUpRight className="h-5 w-5 mr-2" />
                Generate Report
              </Button>
            </motion.div>
          </div>

          {/* Quick Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-10 pt-8 border-t border-slate-700/50">
            {[
              { label: "Active Area", value: "18.4 ha", icon: LayoutGrid, color: "text-blue-400", bg: "bg-blue-400/10" },
              { label: "Avg Moisture", value: "44%", icon: Droplets, color: "text-cyan-400", bg: "bg-cyan-400/10" },
              { label: "Active Alerts", value: "0", icon: Wind, color: "text-[#22c55e]", bg: "bg-[#22c55e]/10" },
              { label: "Pending Tasks", value: "7", icon: Calendar, color: "text-amber-400", bg: "bg-amber-400/10" },
            ].map((stat, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
                className="flex items-center gap-4 group cursor-default"
              >
                <div className={`h-14 w-14 rounded-2xl ${stat.bg} flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-inner border border-white/5`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">{stat.label}</p>
                  <p className="text-2xl font-serif font-bold text-white tracking-tight">{stat.value}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Farm Map Visualization */}
        {is3DView ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl border border-slate-700/50 shadow-2xl overflow-hidden bg-[#1e293b]/50 backdrop-blur-md"
          >
             <Farm3DView blocks={farmBlocks} onBlockClick={(b) => toast.info(`Selected: ${b.blockName}`)} />
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="relative w-full rounded-3xl border border-slate-700/50 shadow-2xl bg-[#0a0f18] overflow-hidden group"
          >
            {/* Map Header Overlay */}
            <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-start z-20 pointer-events-none">
              <div className="flex flex-wrap gap-3 pointer-events-auto">
                <div className="bg-[#1e293b]/80 backdrop-blur-md px-4 py-2 rounded-full shadow-lg border border-slate-700/50 text-xs font-bold text-slate-300 flex items-center gap-2 transition-all hover:bg-[#1e293b]">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#22c55e] shadow-[0_0_8px_rgba(34,197,94,0.6)]" /> Crop Zones
                </div>
                <div className="bg-[#1e293b]/80 backdrop-blur-md px-4 py-2 rounded-full shadow-lg border border-slate-700/50 text-xs font-bold text-slate-300 flex items-center gap-2 transition-all hover:bg-[#1e293b]">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]" /> Infrastructure
                </div>
              </div>

              {weather && (
                <div className="bg-[#1e293b]/80 backdrop-blur-md px-5 py-2.5 rounded-2xl shadow-lg border border-slate-700/50 text-sm font-medium text-slate-200 flex items-center gap-4 pointer-events-auto transition-transform hover:scale-105">
                  <div className="flex items-center gap-2">
                    <Sun className="h-5 w-5 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
                    <span className="font-bold text-white text-lg">{Math.round(weather.main.temp)}°</span>
                  </div>
                  <div className="w-px h-6 bg-slate-600/50" />
                  <div className="flex items-center gap-2">
                    <Droplets className="h-5 w-5 text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.6)]" />
                    <span className="font-bold text-white">{weather.main.humidity}%</span>
                  </div>
                </div>
              )}
            </div>

            {/* Grid Container */}
            <div className="relative z-10 p-8 pt-24 pb-16 min-h-[600px]">
              {/* Sleek Dark Grid Pattern */}
              <div className="absolute inset-0 opacity-[0.1] bg-[linear-gradient(to_right,#64748b_1px,transparent_1px),linear-gradient(to_bottom,#64748b_1px,transparent_1px)] bg-[size:32px_32px]"></div>
              
              {/* Radial gradient to highlight the center */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-transparent via-[#0a0f18]/80 to-[#0a0f18] pointer-events-none"></div>

              <div className="grid grid-cols-5 grid-rows-4 gap-6 max-w-5xl mx-auto aspect-[5/4] relative z-20">
                <AnimatePresence>
                  {farmBlocks.map((block) => {
                    const colors = getColorClasses(block.color);
                    const icon = structureIcons[block.structure];
                    return (
                      <motion.div
                        layout
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        key={block.id}
                        className={`${colors.bgClass} rounded-3xl border ${colors.borderClass} p-5 flex flex-col items-start justify-between relative group transition-all duration-400 hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.6)] cursor-pointer overflow-hidden shadow-lg`}
                        style={{
                          gridRow: `${block.gridPosition.row} / span ${block.gridPosition.rowSpan}`,
                          gridColumn: `${block.gridPosition.col} / span ${block.gridPosition.colSpan}`,
                        }}
                        onClick={() => isEditingLayout && setEditingBlock({ ...block })}
                      >
                        {/* Glow effect on hover */}
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-t from-white/10 to-transparent transition-opacity duration-300"></div>

                        {/* Status Indicator */}
                        <div className="flex justify-between w-full items-start relative z-10">
                          <div className={`h-2.5 w-2.5 rounded-full ${colors.indicatorClass} shadow-[0_0_10px_currentColor]`} />
                          {block.healthStatus === 'warning' && (
                            <div className="bg-red-500/90 backdrop-blur-sm text-white text-[9px] px-2 py-0.5 rounded-full font-bold animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.6)] uppercase tracking-wider border border-red-400/50">Alert</div>
                          )}
                        </div>

                        <div className="mt-auto relative z-10 w-full">
                          <div className="text-4xl mb-3 filter drop-shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6 origin-bottom-left">{icon}</div>
                          <p className="font-serif font-bold text-xl leading-tight text-white mb-1 drop-shadow-md">{block.cropName}</p>
                          <p className="text-[10px] uppercase tracking-widest opacity-80 font-medium truncate drop-shadow-sm">{block.blockName}</p>
                        </div>

                        {/* Interactive Overlay when NOT editing (Details) */}
                        {!isEditingLayout && (
                          <div className="absolute inset-0 bg-[#0f172a]/95 backdrop-blur-xl rounded-3xl p-5 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-center text-white z-20 translate-y-4 group-hover:translate-y-0 border border-white/10">
                            <p className="text-[10px] font-bold text-[#22c55e] uppercase tracking-widest mb-4 flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse"></span>
                              Live Telemetry
                            </p>
                            {block.sensorData ? (
                              <div className="space-y-3 text-xs w-full">
                                <div className="flex justify-between items-center border-b border-white/10 pb-2">
                                  <span className="text-slate-400 flex items-center gap-1.5"><Droplets className="w-3 h-3 text-cyan-400"/> Moisture</span>
                                  <span className="font-bold text-slate-100 bg-white/5 px-2 py-0.5 rounded">{block.sensorData.soilMoisture}%</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-white/10 pb-2">
                                  <span className="text-slate-400 flex items-center gap-1.5"><Thermometer className="w-3 h-3 text-amber-400"/> Temp</span>
                                  <span className="font-bold text-slate-100 bg-white/5 px-2 py-0.5 rounded">{block.sensorData.temperature}°C</span>
                                </div>
                                {block.predictedHarvest && (
                                  <div className="pt-1 flex justify-between items-center">
                                    <span className="text-slate-400 block mb-0.5">Est. Harvest</span>
                                    <span className="font-bold text-white bg-white/5 px-2 py-0.5 rounded">{block.predictedHarvest.toLocaleDateString()}</span>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50">
                                <Wind className="w-6 h-6 mb-2" />
                                <p className="text-[10px] uppercase tracking-wider">Sensors Offline</p>
                              </div>
                            )}

                            <Button variant="outline" size="sm" className="w-full mt-5 h-8 text-xs bg-white/5 border-white/10 text-white hover:bg-white hover:text-[#0f172a] rounded-full transition-colors shadow-inner">
                              Diagnostics
                            </Button>
                          </div>
                        )}

                        {/* Editing Overlay */}
                        {isEditingLayout && (
                          <div className="absolute inset-0 bg-[#0f172a]/80 backdrop-blur-md rounded-3xl flex items-center justify-center gap-3 z-30 border-2 border-dashed border-[#22c55e]/60">
                            <Button size="icon" variant="secondary" className="h-10 w-10 rounded-full bg-white text-black hover:scale-110 transition-transform shadow-lg" onClick={(e) => { e.stopPropagation(); setEditingBlock(block); }}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="destructive" className="h-10 w-10 rounded-full hover:scale-110 transition-transform shadow-lg" onClick={(e) => { e.stopPropagation(); handleDeleteBlock(block.id); }}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                {/* Add Block Button */}
                {isEditingLayout && (
                  <Dialog open={addBlockDialogOpen} onOpenChange={setAddBlockDialogOpen}>
                    <DialogTrigger asChild>
                      <motion.button
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="border-2 border-dashed border-slate-600 rounded-3xl flex flex-col items-center justify-center hover:border-[#22c55e] hover:bg-[#22c55e]/10 transition-all group col-span-1 row-span-1 min-h-[140px] bg-[#1e293b]/30 backdrop-blur-sm"
                      >
                        <div className="h-12 w-12 rounded-full bg-slate-800 flex items-center justify-center group-hover:bg-[#22c55e] transition-colors shadow-lg border border-slate-700 group-hover:border-[#22c55e]">
                          <Plus className="h-6 w-6 text-slate-400 group-hover:text-white" />
                        </div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-3 group-hover:text-[#22c55e] transition-colors">Add Zone</span>
                      </motion.button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md bg-[#1e293b] border-slate-700 text-white shadow-2xl">
                      <DialogHeader>
                        <DialogTitle className="font-serif text-2xl">Initialize New Zone</DialogTitle>
                      </DialogHeader>
                      <div className="grid gap-5 py-4">
                        <div className="grid gap-2">
                          <Label className="text-slate-300">Zone Identifier</Label>
                          <Input value={newBlockName} onChange={(e) => setNewBlockName(e.target.value)} placeholder="e.g. Alpha Quadrant" className="bg-[#0f172a] border-slate-600 focus-visible:ring-[#22c55e]" />
                        </div>
                        <div className="grid gap-2">
                          <Label className="text-slate-300">Asset Type / Crop</Label>
                          <Input value={newCropName} onChange={(e) => setNewCropName(e.target.value)} placeholder="e.g. Hydroponic Tomatoes" className="bg-[#0f172a] border-slate-600 focus-visible:ring-[#22c55e]" />
                        </div>
                        <div className="grid gap-2">
                          <Label className="text-slate-300">Telemetry Theme</Label>
                          <Select value={newBlockColor} onValueChange={setNewBlockColor}>
                            <SelectTrigger className="bg-[#0f172a] border-slate-600 text-white focus:ring-[#22c55e]"><SelectValue /></SelectTrigger>
                            <SelectContent className="bg-[#1e293b] border-slate-700 text-white">
                              {colorOptions.map((c) => (
                                <SelectItem key={c.value} value={c.value} className="focus:bg-slate-700 focus:text-white cursor-pointer">{c.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button onClick={handleAddBlock} className="bg-[#22c55e] hover:bg-[#16a34a] text-white rounded-full px-6 border-0 shadow-lg shadow-[#22c55e]/20">Deploy Zone</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Helper text */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-center text-xs text-slate-500 flex justify-center items-center gap-2 bg-[#1e293b]/30 w-fit mx-auto px-4 py-2 rounded-full border border-slate-800"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-pulse"></div>
          <p>Tip: Enable "<span className="font-semibold text-slate-300">Edit Grid</span>" to configure your digital twin topology.</p>
        </motion.div>

        {/* Edit Block Dialog */}
        <Dialog open={!!editingBlock} onOpenChange={(open) => !open && setEditingBlock(null)}>
          <DialogContent className="bg-[#1e293b] border-slate-700 text-white shadow-2xl">
            <DialogHeader>
              <DialogTitle className="font-serif text-2xl">Reconfigure Zone</DialogTitle>
            </DialogHeader>
            {editingBlock && (
              <div className="grid gap-5 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-300">X Coordinate</Label>
                    <Input type="number" value={editingBlock.gridPosition.col} onChange={(e) => setEditingBlock({ ...editingBlock, gridPosition: { ...editingBlock.gridPosition, col: parseInt(e.target.value) } })} className="bg-[#0f172a] border-slate-600 focus-visible:ring-[#22c55e]" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Y Coordinate</Label>
                    <Input type="number" value={editingBlock.gridPosition.row} onChange={(e) => setEditingBlock({ ...editingBlock, gridPosition: { ...editingBlock.gridPosition, row: parseInt(e.target.value) } })} className="bg-[#0f172a] border-slate-600 focus-visible:ring-[#22c55e]" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Width (Span)</Label>
                    <Input type="number" value={editingBlock.gridPosition.colSpan} onChange={(e) => setEditingBlock({ ...editingBlock, gridPosition: { ...editingBlock.gridPosition, colSpan: parseInt(e.target.value) } })} className="bg-[#0f172a] border-slate-600 focus-visible:ring-[#22c55e]" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Height (Span)</Label>
                    <Input type="number" value={editingBlock.gridPosition.rowSpan} onChange={(e) => setEditingBlock({ ...editingBlock, gridPosition: { ...editingBlock.gridPosition, rowSpan: parseInt(e.target.value) } })} className="bg-[#0f172a] border-slate-600 focus-visible:ring-[#22c55e]" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Asset Name</Label>
                  <Input value={editingBlock.cropName} onChange={(e) => setEditingBlock({ ...editingBlock, cropName: e.target.value })} className="bg-[#0f172a] border-slate-600 focus-visible:ring-[#22c55e]" />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Operational Notes</Label>
                  <Textarea value={editingBlock.description || ''} onChange={(e) => setEditingBlock({ ...editingBlock, description: e.target.value })} placeholder="Add diagnostic notes..." className="bg-[#0f172a] border-slate-600 resize-none h-24 focus-visible:ring-[#22c55e]" />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button onClick={handleUpdateBlock} className="bg-[#22c55e] hover:bg-[#16a34a] text-white rounded-full px-6 border-0 shadow-lg shadow-[#22c55e]/20">Commit Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </AppShell>
  );
}

