"use client";

import { useState, useEffect } from "react";
import { AppShell } from "@/components/app-shell";
import { AppPageHeader } from "@/components/app-page-header";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Pencil,
  Trash2,
  Calendar,
  LayoutGrid,
  Droplets,
  Sun,
  Wind,
  Thermometer,
  ArrowUpRight,
  Save,
  Maximize2,
  MoveHorizontal,
  MoveVertical
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { DndContext, DragEndEvent, useDroppable, useDraggable, DragOverlay, PointerSensor, useSensor, useSensors, closestCenter } from "@dnd-kit/core";
import dynamic from "next/dynamic";

const Farm3DView = dynamic(() => import("@/components/farm-3d-view"), { ssr: false });

type FarmBlock = {
  id: number | string;
  cropName: string;
  blockName: string;
  color: string;
  progress: number;
  gridPosition: { row: number; col: number; rowSpan: number; colSpan: number; };
  structure: 'field' | 'barn' | 'house' | 'greenhouse' | 'irrigation' | 'storage';
  description?: string;
  sensorData?: { soilMoisture: number; temperature: number; humidity: number; };
  healthStatus?: 'healthy' | 'warning' | 'critical';
  predictedHarvest?: Date;
};

const colorOptions = [
  { value: "primary", label: "Eco Green", bgClass: "bg-[#14532d]/40 backdrop-blur-md text-[#4ade80]", borderClass: "border-[#22c55e]/30", indicatorClass: "bg-[#4ade80]" },
  { value: "yellow", label: "Golden Harvest", bgClass: "bg-amber-900/40 backdrop-blur-md text-amber-400", borderClass: "border-amber-500/30", indicatorClass: "bg-amber-400" },
  { value: "brown", label: "Rich Soil", bgClass: "bg-[#3f2e18]/40 backdrop-blur-md text-[#d6cba8]", borderClass: "border-[#854d0e]/30", indicatorClass: "bg-[#d6cba8]" },
  { value: "lightgreen", label: "Fresh Sprout", bgClass: "bg-[#064e3b]/40 backdrop-blur-md text-[#6ee7b7]", borderClass: "border-[#10b981]/30", indicatorClass: "bg-[#34d399]" },
  { value: "darkgreen", label: "Deep Forest", bgClass: "bg-[#022c22]/60 backdrop-blur-md text-[#a7f3d0]", borderClass: "border-[#047857]/30", indicatorClass: "bg-[#10b981]" },
];

const structureIcons = { field: "🌱", barn: "🏭", house: "🏡", greenhouse: "🌿", irrigation: "💧", storage: "📦" };

// Droppable Grid Cell — always mounted, visibility toggles with edit mode
function GridCell({ row, col, visible }: { row: number, col: number, visible: boolean }) {
  const { isOver, setNodeRef } = useDroppable({
    id: `cell-${row}-${col}`,
    data: { row, col }
  });
  return (
    <div
      ref={setNodeRef}
      className={`rounded-3xl border-2 border-dashed transition-all duration-300 ${
        !visible
          ? 'opacity-0'
          : isOver
            ? 'border-[#22c55e] bg-[#22c55e]/20'
            : 'border-slate-700/50 bg-[#1e293b]/20 hover:bg-[#1e293b]/40'
      }`}
      style={{ gridRow: row, gridColumn: col }}
    />
  );
}

// CSS keyframe style injected once for the conflict blink animation
const conflictBlink = `
  @keyframes conflict-blink {
    0%, 100% { box-shadow: 0 0 0 3px rgba(239,68,68,0.9), 0 0 30px rgba(239,68,68,0.5); border-color: rgba(239,68,68,0.9); }
    50% { box-shadow: 0 0 0 1px rgba(239,68,68,0.3), 0 0 8px rgba(239,68,68,0.2); border-color: rgba(239,68,68,0.3); }
  }
`;

// Draggable Block
function DraggableFarmBlock({ block, isEditing, onEdit, onDelete, isConflicting }: {
  block: FarmBlock;
  isEditing: boolean;
  onEdit: (b: FarmBlock) => void;
  onDelete: (id: string | number) => void;
  isConflicting: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `block-${block.id}`,
    data: { id: block.id, block }
  });
  
  const colors = colorOptions.find((c) => c.value === block.color) || colorOptions[0];
  const icon = structureIcons[block.structure] || "🌱";

  const style: React.CSSProperties = {
    gridRow: `${block.gridPosition.row} / span ${block.gridPosition.rowSpan}`,
    gridColumn: `${block.gridPosition.col} / span ${block.gridPosition.colSpan}`,
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    zIndex: isDragging ? 50 : 20,
    opacity: isDragging ? 0.6 : 1,
    touchAction: 'none',
    pointerEvents: isDragging ? 'none' : 'auto',
    ...(isConflicting ? { animation: 'conflict-blink 0.8s ease-in-out infinite', border: '2px solid rgba(239,68,68,0.9)' } : {}),
  };

  return (
    <>
      {isConflicting && <style>{conflictBlink}</style>}
      <motion.div
        ref={setNodeRef}
        {...listeners}
        {...attributes}
        className={`${
          isConflicting
            ? 'bg-red-950/60 backdrop-blur-md'
            : colors.bgClass
        } rounded-3xl border p-5 flex flex-col items-start justify-between relative group transition-shadow duration-400 overflow-hidden shadow-lg ${
          isConflicting ? 'border-red-500' : colors.borderClass
        } cursor-grab active:cursor-grabbing ${isEditing ? 'hover:ring-2 ring-white/20' : 'hover:-translate-y-0 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.6)]'}`}
        style={style}
      >
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-t from-white/10 to-transparent transition-opacity duration-300 pointer-events-none"></div>

        <div className="flex justify-between w-full items-start relative z-10 pointer-events-none">
          <div className={`h-2.5 w-2.5 rounded-full ${isConflicting ? 'bg-red-400 shadow-[0_0_10px_rgba(239,68,68,0.8)]' : colors.indicatorClass + ' shadow-[0_0_10px_currentColor]'}`} />
          {isConflicting && (
            <div className="bg-red-500 text-white text-[9px] px-2 py-0.5 rounded-full font-black animate-bounce shadow-[0_0_12px_rgba(239,68,68,0.8)] uppercase tracking-wider border border-red-300/60 flex items-center gap-1">
              <span>🚨</span> Conflict!
            </div>
          )}
          {!isConflicting && block.healthStatus === 'warning' && (
            <div className="bg-red-500/90 backdrop-blur-sm text-white text-[9px] px-2 py-0.5 rounded-full font-bold animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.6)] uppercase tracking-wider border border-red-400/50">Alert</div>
          )}
        </div>

        <div className="mt-auto relative z-10 w-full pointer-events-none">
          <div className="text-4xl mb-3 filter drop-shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6 origin-bottom-left">{icon}</div>
          <p className={`font-serif font-bold text-xl leading-tight mb-1 drop-shadow-md ${isConflicting ? 'text-red-200' : 'text-white'}`}>{block.cropName}</p>
          <p className="text-[10px] uppercase tracking-widest opacity-80 font-medium truncate drop-shadow-sm">{block.blockName}</p>
        </div>

        {!isEditing && (
          <div className="absolute inset-0 bg-[#0f172a]/95 backdrop-blur-xl rounded-3xl p-5 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-center text-white z-20 translate-y-4 group-hover:translate-y-0 border border-white/10 pointer-events-auto">
            <p className={`text-[10px] font-bold ${isConflicting ? 'text-red-400' : 'text-[#22c55e]'} uppercase tracking-widest mb-4 flex items-center gap-2`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isConflicting ? 'bg-red-400' : 'bg-[#22c55e]'} animate-pulse`}></span>
              {isConflicting ? '⚠ Companion Conflict' : 'Live Telemetry'}
            </p>
            {isConflicting ? (
              <p className="text-xs text-red-300 leading-relaxed">This crop is incompatible with an adjacent neighbour. Move it to a non-adjacent cell to resolve the conflict.</p>
            ) : block.sensorData ? (
              <div className="space-y-3 text-xs w-full">
                <div className="flex justify-between items-center border-b border-white/10 pb-2">
                  <span className="text-slate-400 flex items-center gap-1.5"><Droplets className="w-3 h-3 text-cyan-400"/> Moisture</span>
                  <span className="font-bold text-slate-100 bg-white/5 px-2 py-0.5 rounded">{block.sensorData.soilMoisture}%</span>
                </div>
                <div className="flex justify-between items-center border-b border-white/10 pb-2">
                  <span className="text-slate-400 flex items-center gap-1.5"><Thermometer className="w-3 h-3 text-amber-400"/> Temp</span>
                  <span className="font-bold text-slate-100 bg-white/5 px-2 py-0.5 rounded">{block.sensorData.temperature}°C</span>
                </div>
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

        {isEditing && (
          <div className="absolute inset-0 bg-[#0f172a]/60 backdrop-blur-sm rounded-3xl flex items-center justify-center gap-3 z-30 opacity-0 group-hover:opacity-100 transition-opacity border-2 border-dashed border-[#22c55e]/60">
            <Button size="icon" variant="secondary" className="h-10 w-10 rounded-full bg-white text-black hover:scale-110 transition-transform shadow-lg pointer-events-auto" onPointerDown={(e) => { e.stopPropagation(); onEdit(block); }}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="destructive" className="h-10 w-10 rounded-full hover:scale-110 transition-transform shadow-lg pointer-events-auto" onPointerDown={(e) => { e.stopPropagation(); onDelete(block.id); }}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </motion.div>
    </>
  );
}


export default function FarmTwinPage() {
  const [farmBlocks, setFarmBlocks] = useState<FarmBlock[]>([]);
  const [farmLocation, setFarmLocation] = useState<string | null>(null);
  const [totalSize, setTotalSize] = useState<number>(0);
  const [layout, setLayout] = useState({ rows: 4, cols: 5 });

  const [is3DView, setIs3DView] = useState(false);
  const [isEditingLayout, setIsEditingLayout] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [editingBlock, setEditingBlock] = useState<FarmBlock | null>(null);
  const [newBlockName, setNewBlockName] = useState("");
  const [newCropName, setNewCropName] = useState("");
  const [newBlockColor, setNewBlockColor] = useState("primary");
  const [addBlockDialogOpen, setAddBlockDialogOpen] = useState(false);
  const [weather, setWeather] = useState<any>(null);
  const [activeDragId, setActiveDragId] = useState<string | number | null>(null);

  // Neo4j companion planting conflict state
  const [conflictingBlockIds, setConflictingBlockIds] = useState<Set<string | number>>(new Set());

  useEffect(() => {
    loadFarmData();
  }, []);

  // Check all blocks for adjacent antagonist conflicts via Neo4j
  const checkAdjacentConflicts = async (blocks: FarmBlock[]) => {
    if (blocks.length < 2) {
      setConflictingBlockIds(new Set());
      return;
    }
    try {
      const res = await fetch('/api/graph/crop-conflict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blocks: blocks.map(b => ({ id: b.id, cropName: b.cropName, gridPosition: b.gridPosition })) }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.conflictingBlockIds?.length > 0) {
          setConflictingBlockIds(new Set(data.conflictingBlockIds));
          data.conflicts.forEach((c: any) => {
            toast.error(`⚠️ Companion Conflict: ${c.crop1} & ${c.crop2} should not be planted adjacent!`, {
              duration: 5000,
            });
          });
        } else {
          setConflictingBlockIds(new Set());
        }
      }
    } catch (err) {
      // Silently fail — conflict check is non-blocking
    }
  };

  const loadFarmData = async () => {
    try {
      const response = await fetch('/api/farm');
      if (response.status === 404) {
        window.location.href = "/onboarding";
        return;
      }
      if (response.ok) {
        const farm = await response.json();
        setFarmLocation(farm.location);
        setTotalSize(farm.size);
        if (farm.layout && farm.layout.rows && farm.layout.cols) {
          setLayout({ rows: farm.layout.rows, cols: farm.layout.cols });
        }

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
                row: grid.row || 1, col: grid.col || 1, rowSpan: grid.rowSpan || 1, colSpan: grid.colSpan || 1
              },
              structure: (() => {
                const combined = (b.name + " " + (b.cropType || "")).toLowerCase();
                if (combined.includes('greenhouse') || combined.includes('nursery')) return 'greenhouse';
                if (combined.includes('barn') || combined.includes('cow') || combined.includes('chicken')) return 'barn';
                if (combined.includes('water') || combined.includes('pump') || combined.includes('irrigation')) return 'irrigation';
                if (combined.includes('storage') || combined.includes('silo')) return 'storage';
                if (combined.includes('house') || combined.includes('home')) return 'house';
                return 'field';
              })(),
              sensorData: b.readings?.[0] ? {
                soilMoisture: b.readings[0].moisture || 0,
                temperature: b.readings[0].temp || 0,
                humidity: b.readings[0].humidity || 0
              } : undefined,
              healthStatus: 'healthy',
            };
          });
          setFarmBlocks(mappedBlocks);
        }
      }
      loadWeather();
    } catch (error) {
      console.error("Failed to load farm:", error);
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

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

  // Find the next available empty cell, scanning left-to-right, top-to-bottom
  const findNextEmptyCell = (currentBlocks: FarmBlock[], currentLayout: { rows: number; cols: number }) => {
    const occupied = new Set(
      currentBlocks.map(b => `${b.gridPosition.row}-${b.gridPosition.col}`)
    );
    for (let r = 1; r <= currentLayout.rows; r++) {
      for (let c = 1; c <= currentLayout.cols; c++) {
        if (!occupied.has(`${r}-${c}`)) {
          return { row: r, col: c };
        }
      }
    }
    // Grid is full — expand with a new row
    return { row: currentLayout.rows + 1, col: 1, expandRow: true };
  };

  const handleAddBlock = () => {
    if (!newCropName.trim() || !newBlockName.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    setFarmBlocks(prev => {
      const nextCell = findNextEmptyCell(prev, layout);
      // Auto-expand grid if needed
      if ((nextCell as any).expandRow) {
        setLayout(l => ({ ...l, rows: l.rows + 1 }));
      }
      const newBlock: FarmBlock = {
        id: `temp-${Date.now()}`,
        cropName: newCropName,
        blockName: newBlockName,
        color: newBlockColor,
        progress: 0,
        gridPosition: { row: nextCell.row, col: nextCell.col, rowSpan: 1, colSpan: 1 },
        structure: 'field',
      };
      return [...prev, newBlock];
    });

    setNewCropName("");
    setNewBlockName("");
    setNewBlockColor("primary");
    setAddBlockDialogOpen(false);
    toast.success(`${newBlockName} added to next available cell!`);
    // Re-check for conflicts after adding a new block
    setFarmBlocks(current => {
      checkAdjacentConflicts(current);
      return current;
    });
  };

  const handleUpdateBlock = () => {
    if (!editingBlock) return;
    setFarmBlocks(prev => prev.map((block) => block.id === editingBlock.id ? editingBlock : block));
    setEditingBlock(null);
    toast.success("Zone reconfigured!");
  };

  const handleDeleteBlock = (id: number | string) => {
    setFarmBlocks(prev => prev.filter((block) => block.id !== id));
    toast.success("Zone removed! (Not saved yet)");
  };

  const saveLayout = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/farm/layout', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ layout, blocks: farmBlocks })
      });
      if (response.ok) {
        toast.success("Farm layout successfully saved!");
        setIsEditingLayout(false);
        loadFarmData(); // Reload to get real DB IDs for temp blocks
      } else {
        toast.error("Failed to save layout.");
      }
    } catch (error) {
      toast.error("Error saving layout.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragId(null);
    
    if (over && active.id !== over.id) {
      const blockId = active.data.current?.id;
      const targetData = over.data.current as { row: number, col: number };
      
      if (blockId && targetData) {
        // Auto-enter edit mode on first drag so the Save button appears
        setIsEditingLayout(true);
        setFarmBlocks(prev => {
          const newBlocks = [...prev];
          const sourceIndex = newBlocks.findIndex(b => b.id === blockId);
          if (sourceIndex === -1) return prev;
          
          const sourceBlock = newBlocks[sourceIndex];
          
          // Check if there is already a block at the target destination
          const existingBlockIndex = newBlocks.findIndex(b => 
            b.gridPosition.row === targetData.row && 
            b.gridPosition.col === targetData.col && 
            b.id !== blockId
          );

          if (existingBlockIndex !== -1) {
            // Swap positions
            const tempPos = { ...sourceBlock.gridPosition };
            newBlocks[sourceIndex] = { 
              ...sourceBlock, 
              gridPosition: { ...newBlocks[existingBlockIndex].gridPosition } 
            };
            newBlocks[existingBlockIndex] = { 
              ...newBlocks[existingBlockIndex], 
              gridPosition: tempPos 
            };
          } else {
            // Just move to empty cell
            newBlocks[sourceIndex] = {
              ...sourceBlock,
              gridPosition: {
                ...sourceBlock.gridPosition,
                row: targetData.row,
                col: targetData.col
              }
            };
          }
          // After every drop, re-check companion planting conflicts via Neo4j
          checkAdjacentConflicts(newBlocks);
          return newBlocks;
        });
      }
    }
  };

  const activeBlock = activeDragId ? farmBlocks.find(b => `block-${b.id}` === activeDragId) : null;

  return (
    <AppShell footer={false}>
      <div className="space-y-8 max-w-7xl mx-auto w-full">
        <AppPageHeader subtitle="Manage zones, sensors, and your digital twin" />

        {/* Hero Section */}
        <section className="rounded-2xl bg-white border border-slate-200/80 p-6 md:p-8 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-emerald-100/60 rounded-full blur-[80px] -mr-32 -mt-32 pointer-events-none" />
          <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-5">
              <motion.div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/5 backdrop-blur-md border border-slate-900/10 w-fit shadow-inner">
                <div className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22c55e] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-[#22c55e]"></span>
                </div>
                <span className="text-xs font-bold tracking-widest uppercase text-slate-700">Twin Synced</span>
              </motion.div>
              
              <h2 className="text-4xl md:text-5xl font-serif font-medium text-slate-900 leading-tight">
                Farm Status: <span className="text-[#22c55e]">Optimal</span>
              </h2>
              
              <p className="text-slate-500 max-w-2xl text-base leading-relaxed">
                Your digital farm twin is fully synchronized with live IoT sensors. AI analysis predicts a <span className="text-slate-700 font-medium bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">12% yield increase</span> this season based on current growth velocity.
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              <Button
                onClick={() => setIs3DView(!is3DView)}
                variant="outline"
                className={`transition-all duration-300 rounded-full px-6 h-12 bg-white backdrop-blur-md border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 ${is3DView ? 'ring-2 ring-blue-500/50 bg-blue-50 text-blue-700 border-blue-200' : ''}`}
              >
                <span className="mr-2 opacity-70">Deployment:</span>
                <strong>{is3DView ? '3D Render' : '2D Map'}</strong>
              </Button>

              {isEditingLayout ? (
                <Button onClick={saveLayout} disabled={isSaving} className="rounded-full px-6 h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-600/20 border-0 hover:scale-105 transition-all animate-pulse">
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? 'Saving...' : 'Commit Changes'}
                </Button>
              ) : (
                <Button
                  onClick={() => setIsEditingLayout(true)}
                  disabled={is3DView}
                  variant="outline"
                  className="transition-all duration-300 rounded-full px-6 h-12 bg-white backdrop-blur-md border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                >
                  <LayoutGrid className="h-4 w-4 mr-2" />
                  Edit Farm Grid
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-10 pt-8 border-t border-slate-100">
            {[
              { label: "Active Area", value: `${totalSize} ha`, icon: LayoutGrid, color: "text-blue-500", bg: "bg-blue-50" },
              { label: "Avg Moisture", value: "44%", icon: Droplets, color: "text-cyan-500", bg: "bg-cyan-50" },
              { label: "Active Alerts", value: "0", icon: Wind, color: "text-[#22c55e]", bg: "bg-[#22c55e]/10" },
              { label: "Pending Tasks", value: "7", icon: Calendar, color: "text-amber-500", bg: "bg-amber-50" },
            ].map((stat, i) => (
              <div key={i} className="flex items-center gap-4 group cursor-default">
                <div className={`h-14 w-14 rounded-2xl ${stat.bg} flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-sm border border-black/5`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">{stat.label}</p>
                  <p className="text-2xl font-serif font-bold text-slate-900 tracking-tight">{stat.value}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {is3DView ? (
          <div className="rounded-3xl border border-slate-700/50 shadow-2xl overflow-hidden bg-[#1e293b]/50 backdrop-blur-md">
             <Farm3DView blocks={farmBlocks} onBlockClick={(b) => toast.info(`Selected: ${b.blockName}`)} conflictingBlockIds={conflictingBlockIds} />
          </div>
        ) : (
          <div className="relative w-full rounded-3xl border border-slate-800 shadow-2xl bg-[#0a0f18] overflow-hidden group">
            <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-start z-40 pointer-events-none">
              <div className="flex flex-wrap gap-3 pointer-events-auto">
                {isEditingLayout && (
                  <>
                    <Button variant="secondary" size="sm" onClick={() => setLayout({ ...layout, cols: Math.max(1, layout.cols - 1) })} className="bg-white/10 hover:bg-white/20 text-white rounded-full">
                      <MoveHorizontal className="w-4 h-4 mr-2" /> Shrink X
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => setLayout({ ...layout, cols: layout.cols + 1 })} className="bg-white/10 hover:bg-white/20 text-white rounded-full">
                      <MoveHorizontal className="w-4 h-4 mr-2" /> Expand X
                    </Button>
                    <div className="w-px h-6 bg-slate-700 mx-2 self-center" />
                    <Button variant="secondary" size="sm" onClick={() => setLayout({ ...layout, rows: Math.max(1, layout.rows - 1) })} className="bg-white/10 hover:bg-white/20 text-white rounded-full">
                      <MoveVertical className="w-4 h-4 mr-2" /> Shrink Y
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => setLayout({ ...layout, rows: layout.rows + 1 })} className="bg-white/10 hover:bg-white/20 text-white rounded-full">
                      <MoveVertical className="w-4 h-4 mr-2" /> Expand Y
                    </Button>
                  </>
                )}
              </div>

              {weather && (
                <div className="bg-[#1e293b]/80 backdrop-blur-md px-5 py-2.5 rounded-2xl shadow-lg border border-slate-700/50 text-sm font-medium text-slate-200 flex items-center gap-4 pointer-events-auto">
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

            <div className="relative z-10 p-8 pt-24 pb-16 min-h-[600px] overflow-x-auto">
              <div className="absolute inset-0 opacity-[0.1] bg-[linear-gradient(to_right,#64748b_1px,transparent_1px),linear-gradient(to_bottom,#64748b_1px,transparent_1px)] bg-[size:32px_32px]"></div>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-transparent via-[#0a0f18]/80 to-[#0a0f18] pointer-events-none"></div>

              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={(e) => setActiveDragId(e.active.id)} onDragEnd={handleDragEnd}>
                <div 
                  className="grid gap-6 max-w-6xl mx-auto relative z-20 min-w-[800px]"
                  style={{ 
                    gridTemplateColumns: `repeat(${layout.cols}, minmax(100px, 1fr))`, 
                    gridTemplateRows: `repeat(${layout.rows}, minmax(100px, 1fr))` 
                  }}
                >
                  {/* Background Droppable Grid Cells — always mounted so drop works even outside edit mode */}
                  {Array.from({ length: layout.rows * layout.cols }).map((_, i) => {
                    const row = Math.floor(i / layout.cols) + 1;
                    const col = (i % layout.cols) + 1;
                    return <GridCell key={`cell-${row}-${col}`} row={row} col={col} visible={isEditingLayout} />;
                  })}

                  <AnimatePresence>
                    {farmBlocks.map((block) => (
                      <DraggableFarmBlock
                        key={block.id}
                        block={block}
                        isEditing={isEditingLayout}
                        onEdit={setEditingBlock}
                        onDelete={handleDeleteBlock}
                        isConflicting={conflictingBlockIds.has(block.id)}
                      />
                    ))}
                  </AnimatePresence>

                  {isEditingLayout && (
                    <Dialog open={addBlockDialogOpen} onOpenChange={setAddBlockDialogOpen}>
                      <DialogTrigger asChild>
                        <motion.button
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="border-2 border-dashed border-slate-600 rounded-3xl flex flex-col items-center justify-center hover:border-[#22c55e] hover:bg-[#22c55e]/10 transition-all group col-span-1 row-span-1 min-h-[140px] bg-[#1e293b]/30 backdrop-blur-sm relative z-30"
                          style={{ gridRow: layout.rows, gridColumn: layout.cols }}
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
              </DndContext>
            </div>
          </div>
        )}

        {isEditingLayout && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center text-xs text-slate-500 flex justify-center items-center gap-2 bg-[#1e293b]/30 w-fit mx-auto px-4 py-2 rounded-full border border-slate-800"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-pulse"></div>
            <p>Tip: Drag blocks to rearrange. Don't forget to <span className="font-semibold text-blue-400">Commit Changes</span> to save!</p>
          </motion.div>
        )}

        <Dialog open={!!editingBlock} onOpenChange={(open) => !open && setEditingBlock(null)}>
          <DialogContent className="bg-[#1e293b] border-slate-700 text-white shadow-2xl z-[100]">
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
              </div>
            )}
            <DialogFooter>
              <Button onClick={handleUpdateBlock} className="bg-[#22c55e] hover:bg-[#16a34a] text-white rounded-full px-6 border-0 shadow-lg shadow-[#22c55e]/20">Apply Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </AppShell>
  );
}
