"use client";

import { LayoutDashboard, ListTodo, Store, ScanLine, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { name: "Home", icon: LayoutDashboard, href: "/dashboard" },
    { name: "Tasks", icon: ListTodo, href: "/tasks" },
    { name: "Market", icon: Store, href: "/market" },
    { name: "Scan", icon: ScanLine, href: "/scan" },
    { name: "Profile", icon: User, href: "/profile" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
      <div className="flex justify-around items-center h-16 px-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-colors",
                isActive ? "text-emerald-600" : "text-slate-400"
              )}
            >
              <item.icon className={cn("h-5 w-5", isActive && "stroke-[2.5px]")} />
              <span className={cn("text-[10px] font-semibold", isActive && "font-bold")}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
