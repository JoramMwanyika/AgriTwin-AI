"use client"

import Image from "next/image"
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
          <div className="relative mx-auto w-full max-w-lg mt-14">
            <div className="absolute -inset-4 rounded-3xl bg-[#00e676]/20 blur-3xl opacity-50" />
            <div className="absolute -inset-10 rounded-[40px] bg-teal-500/10 blur-3xl opacity-30" />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <Image
                src="/isometric_smart_farm.png"
                alt="AgriTwin smart farm dashboard"
                width={700}
                height={700}
                className="relative w-full rounded-[32px] object-cover drop-shadow-[0_0_40px_rgba(0,230,118,0.15)] filter brightness-110 contrast-125"
                priority
              />
            </motion.div>
          </div>
          <p className="max-w-md text-sm leading-relaxed text-slate-400 mt-10">
            {tagline ?? "Monitor crops, predict yields, and optimize resources with your AI-powered digital twin."}
          </p>
        </div>

        <div className="flex flex-1 flex-col justify-center px-6 py-10 sm:px-10 lg:px-16 xl:px-24">
          <div className="mb-10 lg:hidden">
            <BrandLogo />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.8, delay: 0.2, type: "spring", bounce: 0.3 }}
            className="mx-auto w-full max-w-md"
          >
            <div className="mb-10">
              <h1 className="text-3xl font-black tracking-tight text-white mb-2">{title}</h1>
              <p className="text-sm font-medium text-slate-400">{subtitle}</p>
            </div>

            {/* Premium glass card to hold the form */}
            <div className="rounded-3xl border border-white/[0.08] bg-white/[0.02] p-8 shadow-[0_0_40px_rgba(0,0,0,0.2)] backdrop-blur-xl">
               {children}
            </div>
            
          </motion.div>
        </div>
      </div>
    </div>
  )
}
