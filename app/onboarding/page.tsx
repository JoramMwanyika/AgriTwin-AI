"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Map, LayoutGrid, ArrowRight, Plus, Trash2, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"
import { BrandLogo } from "@/components/marketing/brand-logo"

type Block = { id: number; name: string; crop: string; size: string }

const steps = [
  { num: 1, label: "Farm details", icon: Map },
  { num: 2, label: "Field blocks", icon: LayoutGrid },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [farmName, setFarmName] = useState("")
  const [farmLocation, setFarmLocation] = useState("")
  const [farmSize, setFarmSize] = useState("")
  const [sizeUnit, setSizeUnit] = useState("Acres")
  const [blocks, setBlocks] = useState<Block[]>([])
  const [newBlock, setNewBlock] = useState({ name: "", crop: "", size: "" })

  const totalBlockSize = blocks.reduce((acc, b) => acc + (parseFloat(b.size) || 0), 0)
  const farmSizeNum = parseFloat(farmSize) || 0
  const coveragePercent = farmSizeNum > 0 ? (totalBlockSize / farmSizeNum) * 100 : 0

  const handleAddBlock = () => {
    if (!newBlock.name || !newBlock.size) return
    setBlocks([...blocks, { ...newBlock, id: Date.now() }])
    setNewBlock({ name: "", crop: "", size: "" })
  }

  const currentStepIsValid = () => {
    if (step === 1) return farmName && farmSize
    if (step === 2) return blocks.length > 0
    return true
  }

  const handleNext = async () => {
    if (step === 1) {
      setStep(2)
      return
    }
    setIsLoading(true)
    try {
      const response = await fetch("/api/farm/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ farmName, farmLocation, farmSize, sizeUnit, blocks }),
      })
      if (response.ok) {
        toast.success("Farm setup complete!")
        router.push("/farm")
      } else {
        throw new Error("Failed to save farm setup")
      }
    } catch {
      toast.error("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="marketing-theme relative min-h-screen bg-slate-50 text-slate-900">
      <div className="relative z-10 mx-auto flex min-h-screen max-w-3xl flex-col px-6 py-10">
        <BrandLogo className="mb-10" />

        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between gap-2">
            {steps.map((s, i) => (
              <div key={s.num} className="flex flex-1 items-center gap-2">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold transition-all ${
                    step >= s.num
                      ? "border-[#0f766e] bg-[#0f766e] text-white shadow-[0_0_20px_rgba(0,230,118,0.35)]"
                      : "border-slate-700 bg-slate-900 text-slate-500"
                  }`}
                >
                  {s.num}
                </div>
                <div className="hidden min-w-0 sm:block">
                  <p className={`text-xs font-medium ${step >= s.num ? "text-[#0f766e]" : "text-slate-500"}`}>
                    Step {s.num}
                  </p>
                  <p className="truncate text-sm font-semibold">{s.label}</p>
                </div>
                {i < steps.length - 1 && (
                  <div
                    className={`mx-2 hidden h-0.5 flex-1 sm:block ${step > s.num ? "bg-[#0f766e]" : "bg-slate-800"}`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-800">
            <motion.div
              className="h-full rounded-full bg-[#0f766e] shadow-[0_0_12px_rgba(0,230,118,0.5)]"
              initial={false}
              animate={{ width: step === 1 ? "50%" : "100%" }}
              transition={{ duration: 0.4 }}
            />
          </div>
        </div>

        <div className="glass-card flex flex-1 flex-col border-slate-300/10 p-6 sm:p-8">
          <div className="mb-6 flex items-center gap-3">
            {step === 1 ? (
              <Map className="h-6 w-6 text-[#0f766e]" />
            ) : (
              <LayoutGrid className="h-6 w-6 text-[#0f766e]" />
            )}
            <div>
              <h1 className="text-xl font-bold sm:text-2xl">
                {step === 1 ? "Tell us about your farm" : "Map your fields"}
              </h1>
              <p className="text-sm text-slate-600">
                {step === 1
                  ? "We'll use this to create your digital twin."
                  : "Add crop blocks to visualize your farm layout."}
              </p>
            </div>
          </div>

          <div className="min-h-[280px] flex-1">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 16 }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label className="text-slate-700">Farm Name</Label>
                    <Input
                      value={farmName}
                      onChange={(e) => setFarmName(e.target.value)}
                      placeholder="e.g. Green Valley Farm"
                      className="input-mkt h-11 border-0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700">Location (optional)</Label>
                    <Input
                      value={farmLocation}
                      onChange={(e) => setFarmLocation(e.target.value)}
                      placeholder="e.g. Nairobi, Kenya"
                      className="input-mkt h-11 border-0"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-slate-700">Total Size</Label>
                      <Input
                        type="number"
                        value={farmSize}
                        onChange={(e) => setFarmSize(e.target.value)}
                        placeholder="10"
                        className="input-mkt h-11 border-0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-700">Unit</Label>
                      <Select value={sizeUnit} onValueChange={setSizeUnit}>
                        <SelectTrigger className="input-mkt h-11 border-0 text-slate-900">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Acres">Acres</SelectItem>
                          <SelectItem value="Hectares">Hectares</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 16 }}
                  className="space-y-5"
                >
                  <div className="rounded-xl border border-slate-300/10 bg-slate-100/30 p-4">
                    <div className="flex justify-between text-xs text-slate-600">
                      <span>
                        Farm: {farmSize} {sizeUnit}
                      </span>
                      <span>
                        Mapped: {totalBlockSize.toFixed(1)} {sizeUnit}
                      </span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-800">
                      <div
                        className={`h-full transition-all duration-500 ${coveragePercent > 100 ? "bg-red-500" : "bg-[#0f766e]"}`}
                        style={{ width: `${Math.min(coveragePercent, 100)}%` }}
                      />
                    </div>
                    <p className="mt-1 text-right text-xs text-slate-500">{coveragePercent.toFixed(0)}% covered</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Input
                      placeholder="Block name"
                      value={newBlock.name}
                      onChange={(e) => setNewBlock({ ...newBlock, name: e.target.value })}
                      className="input-mkt h-10 min-w-[120px] flex-[2] border-0"
                    />
                    <Input
                      placeholder="Crop"
                      value={newBlock.crop}
                      onChange={(e) => setNewBlock({ ...newBlock, crop: e.target.value })}
                      className="input-mkt h-10 min-w-[80px] flex-[2] border-0"
                    />
                    <Input
                      type="number"
                      placeholder="Size"
                      value={newBlock.size}
                      onChange={(e) => setNewBlock({ ...newBlock, size: e.target.value })}
                      className="input-mkt h-10 w-20 border-0"
                    />
                    <button
                      type="button"
                      onClick={handleAddBlock}
                      className="btn-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-xl p-0"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="max-h-[200px] space-y-2 overflow-y-auto pr-1">
                    {blocks.map((block) => (
                      <div
                        key={block.id}
                        className="flex items-center justify-between rounded-xl border border-slate-300/10 bg-slate-100/25 px-4 py-3"
                      >
                        <div>
                          <p className="font-medium">{block.name}</p>
                          <p className="text-xs text-slate-500">
                            {block.crop || "—"} · {block.size} {sizeUnit}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setBlocks(blocks.filter((b) => b.id !== block.id))}
                          className="rounded-lg p-2 text-red-400 transition-colors hover:bg-red-950/40"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    {blocks.length === 0 && (
                      <div className="rounded-xl border border-dashed border-slate-700 py-10 text-center text-sm italic text-slate-500">
                        No blocks yet — add your first field above.
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="mt-8 flex items-center justify-between border-t border-slate-300/10 pt-6">
            {step === 1 ? (
              <button type="button" onClick={() => router.push("/")} className="text-sm text-slate-600 hover:text-slate-900">
                Cancel
              </button>
            ) : (
              <button type="button" onClick={() => setStep(1)} className="text-sm text-slate-600 hover:text-slate-900">
                Back
              </button>
            )}
            <button
              type="button"
              onClick={handleNext}
              className="btn-primary inline-flex h-11 items-center gap-2 px-8"
              disabled={!currentStepIsValid() || isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Setting up...
                </>
              ) : step === 2 ? (
                <>
                  Finish Setup <ArrowRight className="h-4 w-4" />
                </>
              ) : (
                <>
                  Next Step <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
