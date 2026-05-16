"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Contact,
  LayoutDashboard,
  LineChart,
  PiggyBank,
  Receipt,
  Wallet,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/accounts", label: "Accounts", icon: Wallet },
  { href: "/transactions", label: "Transactions", icon: Receipt },
  { href: "/jars", label: "Jars", icon: PiggyBank },
  { href: "/contacts", label: "Contacts", icon: Contact },
  { href: "/insights", label: "Insights", icon: LineChart },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex h-full w-[220px] flex-col border-r border-sidebar-border bg-sidebar backdrop-blur-[24px] p-4">
      {/* Logo Section */}
      <Link href="/dashboard" className="mb-8 flex items-center gap-3 px-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-gradient-to-br from-primary to-primary-light shadow-[0_0_20px_var(--primary-glow)]">
          <Zap className="h-5 w-5 text-black" />
        </div>
        <div>
          <p className="font-bold text-[1.25rem] text-text-primary tracking-tight">FinPulse</p>
          <p className="text-[0.6875rem] text-text-tertiary mt-[2px]">Next-gen banking</p>
        </div>
      </Link>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-1">
        {links.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-sidebar-accent text-primary"
                  : "text-text-secondary hover:bg-[var(--item-hover)] hover:text-text-primary"
              )}
            >
              {/* Active indicator bar */}
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[60%] bg-primary rounded-r-sm shadow-[0_0_12px_var(--primary-glow)]" />
              )}
              <Icon className={cn("h-5 w-5", isActive && "drop-shadow-[0_0_8px_var(--primary-glow)]")} strokeWidth={1.5} />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
