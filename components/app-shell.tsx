"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { BottomNav } from "@/components/bottom-nav";
import { Leaf, Menu } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ListTodo,
  Store,
  ScanLine,
} from "lucide-react";

const mobileNav = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Tasks", href: "/tasks", icon: ListTodo },
  { name: "Market", href: "/market", icon: Store },
  { name: "Scan", href: "/scan", icon: ScanLine },
];

export function AppShell({
  children,
  footer = true,
}: {
  children: React.ReactNode;
  footer?: boolean;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f4f5f7] flex">
      <AppSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden sticky top-0 z-40 bg-white border-b border-slate-200 px-4 h-14 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-slate-800">
            <div className="h-8 w-8 rounded-full bg-emerald-500 flex items-center justify-center">
              <Leaf className="h-4 w-4 text-white" />
            </div>
            AgriTwin
          </Link>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                className="h-10 w-10 rounded-xl border border-slate-200 flex items-center justify-center bg-white"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5 text-slate-600" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[260px] p-0">
              <div className="p-5 border-b border-slate-100 flex items-center gap-2">
                <div className="h-9 w-9 rounded-full bg-emerald-500 flex items-center justify-center">
                  <Leaf className="h-5 w-5 text-white" />
                </div>
                <span className="font-bold text-lg">AgriTwin</span>
              </div>
              <nav className="p-3 space-y-1">
                {mobileNav.map((item) => {
                  const isActive = pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold",
                        isActive
                          ? "bg-emerald-50 text-emerald-700"
                          : "text-slate-600"
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </SheetContent>
          </Sheet>
        </header>

        <main className="flex-1 px-4 md:px-6 lg:px-8 py-6 pb-24 lg:pb-8 max-w-[1400px] w-full mx-auto">
          {children}
        </main>

        {footer && (
          <footer className="hidden lg:block py-4 text-center text-xs text-slate-400 border-t border-slate-200/60 bg-[#f4f5f7]">
            © 2024 AgriTwin. All rights reserved.
          </footer>
        )}
      </div>

      <div className="lg:hidden">
        <BottomNav />
      </div>
    </div>
  );
}
