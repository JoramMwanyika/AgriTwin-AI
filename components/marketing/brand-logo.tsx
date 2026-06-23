import { Leaf } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

export function BrandLogo({ className, href = "/" }: { className?: string; href?: string }) {
  return (
    <Link href={href} className={cn("inline-flex items-center gap-2.5 group", className)}>
      <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#00e676]/30 bg-[#00e676]/10 shadow-[0_0_20px_rgba(0,230,118,0.25)] transition-transform group-hover:scale-105">
        <Leaf className="h-5 w-5 fill-[#00e676] text-[#00e676]" />
      </div>
      <span className="text-lg font-bold tracking-tight text-white">AgriTwin</span>
    </Link>
  )
}
