import Image from "next/image"
import Link from "next/link"
import { cn } from "@/lib/utils"

export function BrandLogo({ className, href = "/" }: { className?: string; href?: string }) {
  return (
    <Link href={href} className={cn("inline-flex items-center gap-2.5 group", className)}>
      <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-white shadow-sm transition-transform group-hover:scale-105">
        <Image src="/brand-logo-realistic.png" alt="AgriTwin Logo" width={40} height={40} className="object-cover" />
      </div>
      <span className="text-lg font-bold tracking-tight text-foreground">AgriTwin</span>
    </Link>
  )
}
