import Image from "next/image"
import Link from "next/link"
import { cn } from "@/lib/utils"

export function BrandLogo({ className, href = "/" }: { className?: string; href?: string }) {
  return (
    <Link href={href} className={cn("inline-flex items-center gap-3 group relative outline-none", className)}>
      <div className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-emerald-500/20 to-teal-900/40 shadow-lg shadow-emerald-500/20 transition-all duration-500 group-hover:scale-105 group-hover:shadow-emerald-500/40 group-hover:border-emerald-500/30">
        <div className="absolute inset-0 bg-emerald-400/20 mix-blend-overlay opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <Image src="/brand-logo-realistic.png" alt="AgriTwin Logo" width={48} height={48} className="object-cover relative z-10" />
      </div>
      <div className="flex flex-col">
        <span className="text-[26px] font-black tracking-tighter bg-gradient-to-br from-white via-slate-100 to-slate-400 bg-clip-text text-transparent group-hover:from-emerald-300 group-hover:to-teal-500 transition-all duration-500 leading-none">
          AgriTwin
        </span>
        <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-emerald-500/80 group-hover:text-emerald-400 transition-colors mt-1">Autonomous</span>
      </div>
      {/* Subtle glowing dot */}
      <span className="absolute -right-1 top-1 h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,1)] animate-ping" />
      <span className="absolute -right-1 top-1 h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,1)]" />
    </Link>
  )
}
