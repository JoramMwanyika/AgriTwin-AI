"use client"

import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"
import { GlowBackground } from "@/components/marketing/glow-background"
import { BrandLogo } from "@/components/marketing/brand-logo"

type AuthLayoutProps = {
  children: React.ReactNode
  title: string
  subtitle: string
  tagline?: string
}

export function AuthLayout({ children, title, subtitle, tagline }: AuthLayoutProps) {
  return (
    <div className="marketing-theme relative min-h-screen overflow-hidden bg-[#050a0e] text-white">
      <GlowBackground />

      <div className="relative z-10 flex min-h-screen flex-col lg:flex-row">
        <div className="relative hidden w-full flex-col justify-between border-r border-white/[0.06] bg-[#030608]/80 p-10 lg:flex lg:w-[48%] xl:w-[52%]">
          <BrandLogo />
          <div className="relative mx-auto w-full max-w-lg">
            <div className="absolute -inset-4 rounded-3xl bg-[#00e676]/10 blur-3xl" />
            <Image
              src="/hero-dashboard.png"
              alt="AgriTwin smart farm dashboard"
              width={640}
              height={480}
              className="relative w-full rounded-2xl object-cover shadow-2xl shadow-black/50"
              priority
            />
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-slate-400">
            {tagline ?? "Monitor crops, predict yields, and optimize resources with your AI-powered digital twin."}
          </p>
        </div>

        <div className="flex flex-1 flex-col justify-center px-6 py-10 sm:px-10 lg:px-14">
          <div className="mb-8 lg:hidden">
            <BrandLogo />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mx-auto w-full max-w-md"
          >
            <div className="mb-8">
              <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">{title}</h1>
              <p className="mt-2 text-sm text-slate-400">{subtitle}</p>
            </div>

            <div className="glass-card border-white/10 p-6 sm:p-8">{children}</div>

            <p className="mt-8 text-center text-sm text-slate-500">
              <Link href="/" className="transition-colors hover:text-[#00e676]">
                ← Back to home
              </Link>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
