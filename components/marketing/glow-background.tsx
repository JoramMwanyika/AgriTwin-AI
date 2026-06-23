import { cn } from "@/lib/utils"

export function GlowBackground({ className }: { className?: string }) {
  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)} aria-hidden>
      <div className="absolute -left-[20%] top-[-10%] h-[55%] w-[55%] rounded-full bg-[#00e676]/8 blur-[120px]" />
      <div className="absolute -right-[15%] bottom-[-15%] h-[50%] w-[50%] rounded-full bg-cyan-500/6 blur-[130px]" />
      <div className="absolute left-1/2 top-1/3 h-[35%] w-[35%] -translate-x-1/2 rounded-full bg-emerald-600/5 blur-[100px]" />
      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,230,118,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,230,118,0.03) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
    </div>
  )
}
