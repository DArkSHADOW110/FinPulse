"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Wallet, LineChart } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/accounts", label: "Accounts", icon: Wallet },
  { href: "/insights", label: "Insights", icon: LineChart },
];

export function MobileTabBar() {
  const pathname = usePathname();

  return (
    <div className="md:hidden fixed bottom-4 left-4 right-4 z-50">
      <nav className="flex justify-around items-center h-16 px-4 bg-[var(--card)] backdrop-blur-[24px] border border-[var(--card-border)] rounded-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_8px_32px_rgba(0,0,0,0.4)]">
        {tabs.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center justify-center w-16 h-full transition-all duration-200 active:scale-95",
                isActive 
                  ? "text-primary drop-shadow-[0_0_12px_var(--primary-glow)]" 
                  : "text-text-tertiary hover:text-text-secondary"
              )}
            >
              <Icon className={cn("h-6 w-6 mb-1", isActive && "animate-pulse-glow")} strokeWidth={1.5} />
              <span className="text-[10px] font-medium tracking-wide">{label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
