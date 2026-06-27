"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  LayoutDashboard,
  ListTodo,
  Store,
  ScanLine,
  Bell,
  Settings,
  HelpCircle,
  Network,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

const mainNav = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Tasks", href: "/tasks", icon: ListTodo },
  { name: "Market", href: "/market", icon: Store },
  { name: "Network", href: "/network", icon: Network },
  { name: "Scan Crops", href: "/scan", icon: ScanLine },
];

const bottomNav = [
  { name: "Notifications", href: "/alerts", icon: Bell, badge: 2 },
  { name: "Settings", href: "/profile", icon: Settings },
  { name: "Help & Support", href: "/profile", icon: HelpCircle },
];

const staggerVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.05,
      type: "spring",
      stiffness: 300,
      damping: 24,
    },
  }),
};

export function AppSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const displayName = session?.user?.name?.split(" ")[0] || "Farmer";

  return (
    <aside className="hidden lg:flex lg:w-[260px] lg:shrink-0 flex-col border-r border-slate-200/50 bg-white/60 backdrop-blur-3xl h-screen sticky top-0 shadow-[4px_0_40px_rgba(0,0,0,0.015)] overflow-hidden">
      
      {/* Animated subtle background blobs */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />
      <div className="absolute bottom-20 left-0 w-40 h-40 bg-indigo-400/10 rounded-full blur-3xl pointer-events-none -ml-20" />

      <div className="flex items-center gap-3 px-6 py-8 relative z-10">
        <motion.div 
            initial={{ scale: 0.8, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl shadow-lg border border-white bg-gradient-to-br from-emerald-50 to-white"
        >
            <Image src="/brand-logo-realistic.png" alt="AgriTwin Logo" width={44} height={44} className="object-cover" />
        </motion.div>
        <div className="flex flex-col">
          <span className="font-extrabold text-2xl bg-gradient-to-br from-slate-900 to-slate-700 bg-clip-text text-transparent tracking-tighter">AgriTwin</span>
          <span className="text-[10px] font-bold text-emerald-600 tracking-widest uppercase flex items-center gap-1">
             <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live System
          </span>
        </div>
      </div>

      <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto relative z-10 fancy-scrollbar">
        <div className="flex items-center gap-2 px-4 mb-4 mt-2">
            <span className="h-[1px] w-4 bg-slate-200" />
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Main Menu</p>
        </div>
        
        {mainNav.map((item, i) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link key={item.name} href={item.href} className="relative block group outline-none mb-1.5">
              <motion.div
                custom={i}
                initial="hidden"
                animate="visible"
                variants={staggerVariants}
                className={cn(
                  "relative z-10 flex items-center gap-3.5 px-4 py-3.5 rounded-2xl text-[14px] font-bold transition-all duration-300 w-full overflow-hidden",
                  isActive ? "text-emerald-800 shadow-[0_4px_20px_rgba(16,185,129,0.08)]" : "text-slate-500 hover:text-slate-900 hover:bg-slate-50/80"
                )}
              >
                {isActive && (
                  <>
                    <motion.div
                      layoutId="active-nav-bg"
                      className="absolute inset-0 bg-gradient-to-r from-emerald-100/80 to-emerald-50/30 border border-emerald-200/50 rounded-2xl -z-10"
                      initial={false}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                    <motion.div
                      layoutId="active-nav-indicator"
                      className="absolute left-0 top-1/2 -translate-y-1/2 h-1/2 w-1.5 bg-emerald-500 rounded-r-full shadow-[0_0_10px_rgba(16,185,129,0.5)] -z-10"
                      initial={false}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  </>
                )}
                
                <div className={cn(
                    "relative flex items-center justify-center transition-transform duration-300",
                    isActive ? "scale-110" : "group-hover:scale-110"
                )}>
                   {isActive && <div className="absolute inset-0 bg-emerald-400/20 blur-md rounded-full -z-10" />}
                   <item.icon
                     className={cn(
                       "h-5 w-5 transition-colors duration-300",
                       isActive ? "text-emerald-600" : "text-slate-400 group-hover:text-slate-700"
                     )}
                   />
                </div>
                <span className="flex-1 tracking-tight">{item.name}</span>
                {isActive && (
                   <ChevronRight className="h-4 w-4 text-emerald-500/50" />
                )}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-2 space-y-1 relative z-10">
        <div className="flex items-center gap-2 px-4 mb-4 mt-4">
            <span className="h-[1px] w-4 bg-slate-200" />
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">System</p>
        </div>
        {bottomNav.map((item, i) => (
          <Link key={item.name} href={item.href} className="relative block group outline-none mb-1">
             <motion.div
                custom={i + mainNav.length}
                initial="hidden"
                animate="visible"
                variants={staggerVariants}
                className="relative z-10 flex items-center gap-3.5 px-4 py-3 rounded-2xl text-[13px] font-bold text-slate-500 transition-all duration-300 hover:bg-slate-100/80 hover:text-slate-900 w-full"
            >
                <item.icon className="h-4 w-4 text-slate-400 group-hover:text-slate-700 group-hover:scale-110 transition-all duration-300" />
                <span className="flex-1 tracking-tight">{item.name}</span>
                {item.badge ? (
                <motion.span 
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.5, type: "spring", stiffness: 400, damping: 10 }}
                    className="h-5 min-w-5 px-1.5 rounded-full bg-gradient-to-br from-red-500 to-rose-600 text-white text-[10px] font-extrabold flex items-center justify-center shadow-lg shadow-red-500/30"
                >
                    {item.badge}
                </motion.span>
                ) : null}
            </motion.div>
          </Link>
        ))}
      </div>

      <div className="p-5 mt-auto relative z-10 w-full">
        <Link
          href="/profile"
          className="relative flex items-center gap-3 p-3.5 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden group shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-400 border border-slate-700/50"
        >
          {/* subtle glow inside button */}
          <div className="absolute inset-0 bg-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          <div className="relative h-11 w-11 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white font-black flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(16,185,129,0.4)] group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 border border-white/20 text-lg">
            {displayName.charAt(0).toUpperCase()}
          </div>
          
          <div className="min-w-0 flex-1 relative">
            <div className="flex items-center gap-1.5 mb-0.5">
               <p className="font-extrabold text-sm text-white truncate tracking-tight">{displayName}</p>
               <Sparkles className="h-3 w-3 text-emerald-400 shrink-0" />
            </div>
            <p className="text-[10px] font-bold text-slate-400 group-hover:text-emerald-300 transition-colors uppercase tracking-wider">
              Manage Account
            </p>
          </div>
        </Link>
      </div>

      <style jsx global>{`
        .fancy-scrollbar::-webkit-scrollbar { width: 4px; }
        .fancy-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .fancy-scrollbar::-webkit-scrollbar-thumb { background-color: transparent; border-radius: 10px; }
        .fancy-scrollbar:hover::-webkit-scrollbar-thumb { background-color: #cbd5e1; }
      `}</style>
    </aside>
  );
}
