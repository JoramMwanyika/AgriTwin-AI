"use client"

import { useRef, useState } from "react"
import { motion, useInView } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import {
  Leaf,
  ArrowRight,
  Play,
  Menu,
  X,
  Globe,
  Brain,
  Layers,
  Wifi,
  BarChart3,
  Sprout,
  Building2,
  Quote,
  Send,
  Linkedin,
  Twitter,
  Instagram,
  Facebook,
  ChevronRight,
} from "lucide-react"
import { BrandLogo } from "@/components/marketing/brand-logo"
import { GlowBackground } from "@/components/marketing/glow-background"
import { cn } from "@/lib/utils"

function FadeIn({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode
  delay?: number
  className?: string
}) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-80px" })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

const navLinks = [
  { href: "#solutions", label: "Solutions" },
  { href: "#about", label: "About" },
  { href: "#how-it-works", label: "Features" },
  { href: "#use-cases", label: "Use Cases" },
  { href: "#contact", label: "Contact" },
]

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="marketing-theme min-h-screen bg-[#050a0e] font-sans text-white antialiased selection:bg-[#00e676]/30 selection:text-white">
      <GlowBackground />

      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#050a0e]/80 backdrop-blur-xl">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-10">
          <BrandLogo />
          <div className="hidden items-center gap-8 text-sm font-medium text-slate-400 md:flex">
            {navLinks.map((l) => (
              <Link key={l.href} href={l.href} className="transition-colors hover:text-white">
                {l.label}
              </Link>
            ))}
          </div>
          <div className="hidden items-center gap-3 md:flex">
            <Link href="/login" className="px-4 text-sm font-medium text-slate-300 transition-colors hover:text-white">
              Sign in
            </Link>
            <Link href="/register" className="btn-primary inline-flex h-10 items-center gap-2 px-6 text-sm">
              Get Started <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <button type="button" className="text-white md:hidden" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </nav>
        {menuOpen && (
          <div className="border-t border-white/[0.06] bg-[#050a0e] px-6 py-4 md:hidden">
            {navLinks.map((l) => (
              <Link key={l.href} href={l.href} className="block py-2 text-slate-300" onClick={() => setMenuOpen(false)}>
                {l.label}
              </Link>
            ))}
            <div className="mt-4 flex flex-col gap-2">
              <Link href="/login" className="py-2 text-[#00e676]">
                Sign in
              </Link>
              <Link href="/register" className="btn-primary inline-flex h-10 items-center justify-center text-sm">
                Get Started
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden px-6 pb-20 pt-12 lg:px-10 lg:pb-28 lg:pt-16">
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <FadeIn>
            <h1 className="text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
              Transforming Agriculture with{" "}
              <span className="bg-gradient-to-r from-[#00e676] to-emerald-300 bg-clip-text text-transparent">
                Digital Twin Tech
              </span>
            </h1>
            <p className="mt-6 max-w-lg text-base leading-relaxed text-slate-400 sm:text-lg">
              Create a virtual replica of your farm to simulate changes, monitor crops in real time, and optimize
              resources with your AI assistant.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link href="/register" className="btn-primary inline-flex h-12 items-center gap-2 px-8 text-base">
                Get Started <ArrowRight className="h-5 w-5" />
              </Link>
              <button type="button" className="btn-outline inline-flex h-12 items-center gap-2 px-6 text-sm font-medium">
                <Play className="h-4 w-4 fill-current" /> Watch Demo
              </button>
            </div>
            <div className="mt-10 flex items-center gap-4">
              <div className="flex -space-x-2">
                {["JM", "BK", "VD"].map((initials, i) => (
                  <div
                    key={initials}
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#050a0e] text-xs font-bold",
                      i === 0 && "bg-emerald-600",
                      i === 1 && "bg-cyan-700",
                      i === 2 && "bg-violet-700",
                    )}
                  >
                    {initials}
                  </div>
                ))}
              </div>
              <p className="text-sm text-slate-400">
                Trusted by <span className="font-semibold text-white">1,200+</span> farmers across Kenya
              </p>
            </div>
          </FadeIn>

          <FadeIn delay={0.15} className="relative">
            <div className="absolute -inset-6 rounded-3xl bg-[#00e676]/10 blur-3xl" />
            <div className="relative overflow-hidden rounded-2xl ring-1 ring-[#00e676]/20 shadow-2xl shadow-black/60">
              <Image
                src="/hero-dashboard.png"
                alt="AgriTwin smart farm digital twin dashboard"
                width={700}
                height={520}
                className="w-full object-cover"
                priority
              />
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Solutions */}
      <section id="solutions" className="border-t border-white/[0.04] bg-[#030608]/50 px-6 py-20 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <FadeIn className="text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">Our Solutions</h2>
            <p className="mx-auto mt-4 max-w-2xl text-slate-400">
              Everything you need to run a smarter, more sustainable farm — from sensors to AI insights.
            </p>
          </FadeIn>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {[
              {
                icon: Globe,
                title: "Real-time Monitoring",
                desc: "Track soil moisture, temperature, and crop health across every block from one dashboard.",
              },
              {
                icon: Brain,
                title: "AI-Powered Insights",
                desc: "Get disease detection, pest alerts, and voice-friendly advice in English, Swahili, and more.",
              },
              {
                icon: Layers,
                title: "Digital Twin Simulation",
                desc: "Simulate irrigation and planting changes on a virtual replica before you act in the field.",
              },
            ].map((item, i) => (
              <FadeIn key={item.title} delay={i * 0.08}>
                <div className="glass-card group flex h-full flex-col p-8 transition-all hover:border-[#00e676]/30 hover:shadow-[0_0_40px_rgba(0,230,118,0.08)]">
                  <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#00e676]/20 bg-[#00e676]/10 text-[#00e676] shadow-[0_0_24px_rgba(0,230,118,0.15)] transition-colors group-hover:bg-[#00e676] group-hover:text-[#050a0e]">
                    <item.icon className="h-7 w-7" />
                  </div>
                  <h3 className="text-xl font-bold">{item.title}</h3>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-400">{item.desc}</p>
                  <Link href="/register" className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-[#00e676] hover:gap-2 transition-all">
                    Learn more <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="px-6 py-20 lg:px-10">
        <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-2">
          <FadeIn>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#00e676]">About AgriTwin</p>
            <h2 className="mt-4 text-3xl font-bold leading-tight sm:text-4xl">
              Empowering farmers with accessible precision agriculture
            </h2>
            <p className="mt-6 leading-relaxed text-slate-400">
              AgriTwin started with a single purpose: make precision agriculture accessible to every farmer. By
              combining digital twin technology with AI that speaks your language, we help you make data-driven
              decisions that increase yield and sustainability.
            </p>
            <div className="mt-10 grid grid-cols-3 gap-6">
              {[
                { value: "1,200+", label: "Happy Users" },
                { value: "25K+", label: "Acres Monitored" },
                { value: "98%", label: "Satisfaction" },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="text-2xl font-bold text-[#00e676] sm:text-3xl">{stat.value}</p>
                  <p className="mt-1 text-xs text-slate-500 sm:text-sm">{stat.label}</p>
                </div>
              ))}
            </div>
          </FadeIn>
          <FadeIn delay={0.1} className="relative">
            <div className="glass-card overflow-hidden p-2 ring-1 ring-white/10">
              <div className="relative aspect-[4/3] overflow-hidden rounded-xl">
                <Image
                  src="/about-farmer.png"
                  alt="Farmer using AgriTwin tablet in the field"
                  fill
                  className="object-cover object-center"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#050a0e]/40 via-transparent to-transparent lg:from-[#050a0e]/20" />
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="border-t border-white/[0.04] bg-[#030608]/50 px-6 py-20 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <FadeIn className="text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">How It Works</h2>
            <p className="mx-auto mt-4 max-w-xl text-slate-400">Four simple steps from signup to smarter harvests.</p>
          </FadeIn>
          <div className="relative mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div className="absolute top-10 left-[12%] right-[12%] hidden h-px border-t border-dashed border-[#00e676]/20 lg:block" />
            {[
              { step: 1, icon: Wifi, title: "Connect", desc: "Link sensors and map your farm blocks in minutes." },
              { step: 2, icon: Globe, title: "Monitor", desc: "Watch live moisture, NPK, and weather on your twin." },
              { step: 3, icon: BarChart3, title: "Analyze", desc: "AI scans crops and surfaces actionable insights." },
              { step: 4, icon: Sprout, title: "Grow", desc: "Act on recommendations and track yield improvements." },
            ].map((item, i) => (
              <FadeIn key={item.title} delay={i * 0.06} className="relative flex flex-col items-center text-center">
                <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full border-4 border-[#050a0e] bg-[#00e676] text-xl font-bold text-[#050a0e] shadow-[0_0_30px_rgba(0,230,118,0.4)]">
                  {item.step}
                </div>
                <div className="mt-6 flex h-12 w-12 items-center justify-center rounded-xl border border-[#00e676]/20 bg-[#00e676]/10 text-[#00e676]">
                  <item.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 font-bold">{item.title}</h3>
                <p className="mt-2 text-sm text-slate-400">{item.desc}</p>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Use cases */}
      <section id="use-cases" className="px-6 py-20 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <FadeIn className="text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">Built for Every Farm</h2>
            <p className="mx-auto mt-4 max-w-xl text-slate-400">From smallholders to agribusiness — scale at your pace.</p>
          </FadeIn>
          <div className="mt-14 grid gap-6 sm:grid-cols-2">
            {[
              { icon: Sprout, title: "Crop Farming", desc: "Maize, beans, tomatoes — monitor blocks and get localized advice.", color: "text-[#00e676] border-[#00e676]/25 bg-[#00e676]/10" },
              { icon: Layers, title: "Greenhouses", desc: "Fine-tune humidity and temperature for high-value produce.", color: "text-cyan-400 border-cyan-500/25 bg-cyan-500/10" },
              { icon: Globe, title: "Livestock & Mixed", desc: "Combine pasture and crop data in one digital twin view.", color: "text-violet-400 border-violet-500/25 bg-violet-500/10" },
              { icon: Building2, title: "Agri Businesses", desc: "Manage teams, tasks, and multiple farms from a single dashboard.", color: "text-amber-400 border-amber-500/25 bg-amber-500/10" },
            ].map((item, i) => (
              <FadeIn key={item.title} delay={i * 0.06}>
                <div className="glass-card flex gap-5 p-6 transition-colors hover:border-white/15">
                  <div className={cn("flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border", item.color)}>
                    <item.icon className="h-7 w-7" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">{item.title}</h3>
                    <p className="mt-2 text-sm text-slate-400">{item.desc}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="border-t border-white/[0.04] bg-[#030608]/50 px-6 py-20 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <FadeIn className="text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">What Our Users Say</h2>
          </FadeIn>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {[
              { quote: "AgriTwin helped me catch a maize disease early. The voice advisor in Swahili is a game changer.", name: "James M.", role: "Maize Farmer, Nakuru" },
              { quote: "We monitor three greenhouses from one phone. Moisture alerts alone saved our tomato crop.", name: "Grace W.", role: "Greenhouse Owner" },
              { quote: "Our co-op uses it to assign field tasks. Farmers finally have one place for weather and prices.", name: "Peter O.", role: "Co-op Manager" },
            ].map((t, i) => (
              <FadeIn key={t.name} delay={i * 0.08}>
                <div className="glass-card flex h-full flex-col p-6">
                  <Quote className="h-8 w-8 text-[#00e676]/60" />
                  <p className="mt-4 flex-1 text-sm leading-relaxed text-slate-300">&ldquo;{t.quote}&rdquo;</p>
                  <div className="mt-6 flex items-center gap-3 border-t border-white/[0.06] pt-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#00e676]/20 text-sm font-bold text-[#00e676]">
                      {t.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{t.name}</p>
                      <p className="text-xs text-slate-500">{t.role}</p>
                    </div>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-16 lg:px-10">
        <FadeIn>
          <div className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl border border-[#00e676]/20 bg-gradient-to-br from-[#00e676]/10 via-[#030608] to-[#050a0e] p-10 text-center shadow-[0_0_60px_rgba(0,230,118,0.12)] sm:p-14">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#00e676]/10 blur-3xl" />
            <h2 className="relative text-3xl font-bold sm:text-4xl">Ready to grow smarter?</h2>
            <p className="relative mx-auto mt-4 max-w-lg text-slate-400">
              Join thousands of farmers using AI-powered digital twins. Free to start — set up your farm in minutes.
            </p>
            <Link href="/register" className="btn-primary relative mt-8 inline-flex h-12 items-center gap-2 px-10 text-base">
              Get Started for Free <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </FadeIn>
      </section>

      {/* Footer */}
      <footer id="contact" className="border-t border-white/[0.06] bg-[#030608] px-6 pb-10 pt-16 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <BrandLogo />
              <p className="mt-4 max-w-xs text-sm text-slate-400">
                Digital twin technology for sustainable, data-driven farming across Africa.
              </p>
              <div className="mt-6 flex gap-4">
                {[Twitter, Linkedin, Instagram, Facebook].map((Icon, i) => (
                  <a
                    key={i}
                    href="#"
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-slate-400 transition-colors hover:border-[#00e676]/40 hover:text-[#00e676]"
                    aria-label="Social"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>
            {[
              { title: "Product", links: ["Solutions", "Features", "Pricing", "Demo"] },
              { title: "Company", links: ["About", "Team", "Careers", "Contact"] },
              { title: "Resources", links: ["Blog", "Docs", "Support", "FAQ"] },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="font-semibold text-sm">{col.title}</h4>
                <ul className="mt-4 space-y-2">
                  {col.links.map((link) => (
                    <li key={link}>
                      <Link href="#" className="text-sm text-slate-500 transition-colors hover:text-[#00e676]">
                        {link}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <div>
              <h4 className="font-semibold text-sm">Newsletter</h4>
              <p className="mt-2 text-xs text-slate-500">Farm tips and product updates.</p>
              <form className="mt-4 flex gap-2" onSubmit={(e) => e.preventDefault()}>
                <input
                  type="email"
                  placeholder="Your email"
                  className="input-mkt h-10 flex-1 px-3 text-sm"
                />
                <button type="submit" className="btn-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-full p-0">
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          </div>
          <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-white/[0.06] pt-8 text-xs text-slate-500 sm:flex-row">
            <div className="flex items-center gap-2">
              <Leaf className="h-4 w-4 text-[#00e676]" />
              <span>&copy; 2026 AgriTwin. All rights reserved.</span>
            </div>
            <div className="flex gap-6">
              <Link href="#" className="hover:text-white">
                Privacy Policy
              </Link>
              <Link href="#" className="hover:text-white">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
