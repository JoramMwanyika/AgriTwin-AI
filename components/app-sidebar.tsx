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
  Leaf,
} from "lucide-react";
import { cn } from "@/lib/utils";

const mainNav = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Tasks", href: "/tasks", icon: ListTodo },
  { name: "Market", href: "/market", icon: Store },
  { name: "Scan Crops", href: "/scan", icon: ScanLine },
];

const bottomNav = [
  { name: "Notifications", href: "/alerts", icon: Bell, badge: 2 },
  { name: "Settings", href: "/profile", icon: Settings },
  { name: "Help & Support", href: "/profile", icon: HelpCircle },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const displayName = session?.user?.name?.split(" ")[0] || "Farmer";

  return (
    <aside className="hidden lg:flex lg:w-[220px] lg:shrink-0 flex-col border-r border-slate-200/80 bg-white h-screen sticky top-0">
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-slate-100">
        <div className="h-9 w-9 rounded-full bg-emerald-500 flex items-center justify-center shadow-sm shadow-emerald-500/30">
          <Leaf className="h-5 w-5 text-white" />
        </div>
        <span className="font-bold text-lg text-slate-800 tracking-tight">AgriTwin</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {mainNav.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors",
                isActive
                  ? "bg-emerald-50 text-emerald-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <item.icon
                className={cn(
                  "h-5 w-5",
                  isActive ? "text-emerald-600" : "text-slate-400"
                )}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-2 space-y-1 border-t border-slate-100">
        {bottomNav.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
          >
            <item.icon className="h-5 w-5 text-slate-400" />
            <span className="flex-1">{item.name}</span>
            {item.badge ? (
              <span className="h-5 min-w-5 px-1.5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                {item.badge}
              </span>
            ) : null}
          </Link>
        ))}
      </div>

      <div className="p-4 mt-auto border-t border-slate-100">
        <Link
          href="/profile"
          className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group"
        >
          <div className="h-10 w-10 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center shrink-0 border border-emerald-200">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="font-bold text-sm text-slate-800 truncate">{displayName}</p>
            <p className="text-xs text-slate-500 group-hover:text-emerald-600 transition-colors">
              View profile
            </p>
          </div>
        </Link>
      </div>
    </aside>
  );
}
