"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { ChatPanel } from "@/components/chat/chat-panel";
import { MobileChatButton } from "@/components/chat/mobile-chat-button";
import { MobileTabBar } from "@/components/layout/mobile-tab-bar";
import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { ActionHubControllerProvider } from "@/components/action-hub/action-hub-controller";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();

  return (
    <ActionHubControllerProvider>
      <div className="flex h-screen text-foreground relative overflow-hidden">
      {/* Background Gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-[var(--background-gradient-from)] via-[var(--background-gradient-via)] to-[var(--background-gradient-to)]" />
      
      {/* Ambient Glow Effects */}
      <div className="fixed top-0 left-1/4 w-[600px] h-[600px] bg-[var(--cyber-cyan)]/[0.03] rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-[500px] h-[500px] bg-[var(--cyber-cyan)]/[0.02] rounded-full blur-[100px] pointer-events-none" />

      {/* Grid Pattern Overlay */}
      <div className="fixed inset-0 opacity-[0.02] pointer-events-none">
        <svg className="w-full h-full">
          <defs>
            <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="var(--cyber-cyan)" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="relative z-10 flex w-full">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Header */}
          <header className="flex h-14 items-center justify-between border-b border-[var(--card-border)] backdrop-blur-[24px] bg-[var(--background)]/60 px-4 md:px-6">
            <p className="text-lg md:text-sm font-semibold md:font-normal text-text-primary md:text-text-secondary truncate max-w-[200px] md:max-w-full">
              Welcome back{session?.user?.name ? `, ${session.user.name.split(" ")[0]}` : ""}
            </p>
            <div className="flex items-center gap-1 md:gap-2">
              <ThemeToggle />
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => signOut({ callbackUrl: "/login" })} 
                className="md:w-auto md:px-3 hover:bg-[var(--item-hover)] hover:text-text-primary transition-all group"
              >
                <LogOut className="h-5 w-5 md:h-4 md:w-4 md:mr-2 group-hover:text-primary transition-colors" />
                <span className="hidden md:inline text-sm">Sign out</span>
              </Button>
            </div>
          </header>

          {/* Main Content Area */}
          <div className="flex flex-1 overflow-hidden">
            <main className="flex-1 overflow-y-auto p-4 pb-24 md:p-6 lg:p-8 md:pb-8 scrollbar-thin">{children}</main>
            
            {/* AI Assistant Panel - Desktop */}
            <div className="hidden xl:flex w-[320px] flex-col border-l border-[var(--card-border)] backdrop-blur-[24px] bg-[var(--ai-panel-bg)]">
              <ChatPanel />
            </div>
          </div>
        </div>
      </div>
      <MobileTabBar />
      <MobileChatButton />
      </div>
    </ActionHubControllerProvider>
  );
}
