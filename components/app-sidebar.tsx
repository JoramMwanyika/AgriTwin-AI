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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
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
    <aside className="hidden lg:flex lg:w-[240px] lg:shrink-0 flex-col border-r border-slate-200/80 bg-white/70 backdrop-blur-3xl h-screen sticky top-0 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
      <div className="flex items-center gap-3 px-6 py-6 h-[80px]">
        <motion.div 
            initial={{ scale: 0.8, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-white shadow-sm"
        >
            <Image src="/brand-logo-realistic.png" alt="AgriTwin Logo" width={40} height={40} className="object-cover" />
        </motion.div>
        <span className="font-extrabold text-xl text-slate-800 tracking-tight">AgriTwin</span>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        <p className="px-4 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-4 mt-2">Main Menu</p>
        
        {mainNav.map((item, i) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link key={item.name} href={item.href} className="relative block group outline-none">
              <motion.div
                custom={i}
                initial="hidden"
                animate="visible"
                variants={staggerVariants}
                className={cn(
                  "relative z-10 flex items-center gap-3.5 px-4 py-3 rounded-2xl text-[14px] font-bold transition-colors w-full",
                  isActive ? "text-teal-900" : "text-slate-500 hover:text-slate-900"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-nav"
                    className="absolute inset-0 bg-teal-50 border border-teal-100/50 rounded-2xl -z-10 shadow-sm"
                    initial={false}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <item.icon
                  className={cn(
                    "h-[18px] w-[18px] transition-all duration-300",
                    isActive ? "text-teal-600 scale-110" : "text-slate-400 group-hover:scale-110 group-hover:text-slate-700"
                  )}
                />
                {item.name}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-4 space-y-1">
        <p className="px-4 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">Preferences</p>
        {bottomNav.map((item, i) => (
          <Link key={item.name} href={item.href} className="relative block group outline-none">
             <motion.div
                custom={i + mainNav.length}
                initial="hidden"
                animate="visible"
                variants={staggerVariants}
                className="relative z-10 flex items-center gap-3.5 px-4 py-3 rounded-2xl text-[14px] font-bold text-slate-500 transition-all hover:bg-slate-50 hover:text-slate-900 w-full"
            >
                <item.icon className="h-[18px] w-[18px] text-slate-400 group-hover:text-slate-700 group-hover:scale-110 transition-all duration-300" />
                <span className="flex-1">{item.name}</span>
                {item.badge ? (
                <motion.span 
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.5, type: "spring", stiffness: 400, damping: 10 }}
                    className="h-5 min-w-5 px-1.5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center shadow-md shadow-red-500/20"
                >
                    {item.badge}
                </motion.span>
                ) : null}
            </motion.div>
          </Link>
        ))}
      </div>

      <div className="p-4 mt-auto">
        <Link
          href="/profile"
          className="flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50/80 transition-all group border border-transparent hover:border-slate-200 hover:shadow-sm"
        >
          <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-teal-100 to-teal-50 text-teal-700 font-black flex items-center justify-center shrink-0 border border-teal-200/60 shadow-inner group-hover:scale-105 transition-transform duration-300">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="font-bold text-sm text-slate-800 truncate">{displayName}</p>
            <p className="text-[11px] font-semibold text-slate-400 group-hover:text-teal-600 transition-colors">
              Manage account
            </p>
          </div>
        </Link>
      </div>
    </aside>
  );
}
