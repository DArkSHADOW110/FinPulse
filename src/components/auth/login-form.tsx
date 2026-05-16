"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Check, Loader2, Rocket, Zap } from "lucide-react";

export function LoginForm() {
  const [showGoogle, setShowGoogle] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [authenticating, setAuthenticating] = useState(false);

  function launch() {
    setLaunching(true);
    window.setTimeout(() => {
      setShowGoogle(true);
      setLaunching(false);
    }, 800);
  }

  function loginWithGoogle() {
    setAuthenticating(true);
    signIn("google", { callbackUrl: "/dashboard" });
  }

  return (
    <div className="relative z-10 w-full max-w-[460px] animate-[fadeInUp_1s_cubic-bezier(0.16,1,0.3,1)_forwards] overflow-hidden rounded-[32px] border border-white/70 bg-white/55 p-8 text-center shadow-[0_30px_60px_rgba(15,23,42,0.16),inset_0_1px_0_rgba(255,255,255,0.85)] backdrop-blur-[40px] transition-colors duration-500 md:p-14 dark:border-white/[0.08] dark:bg-slate-900/40 dark:shadow-[0_30px_60px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.1)]">
      <div className="pointer-events-none absolute inset-0 rounded-[32px] bg-[linear-gradient(135deg,rgba(255,255,255,0.65)_0%,transparent_100%)] dark:bg-[linear-gradient(135deg,rgba(255,255,255,0.05)_0%,transparent_100%)]" />

      <div className="relative z-[2]">
        <div className="mx-auto mb-7 flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-500/30 bg-cyan-100/70 text-cyan-600 shadow-[0_0_40px_rgba(0,180,216,0.18)] dark:border-cyan-300/30 dark:bg-cyan-300/10 dark:text-cyan-300 dark:shadow-[0_0_40px_rgba(0,242,254,0.25)]">
          <Zap className="h-8 w-8" />
        </div>
        <h1 className="text-3xl font-semibold tracking-[-0.03em] text-slate-950 md:text-[2.2rem] dark:text-slate-50">
          Your Money&apos;s Happy Place
        </h1>
        <p className="mt-3 text-base text-slate-600 md:text-[1.05rem] dark:text-slate-400">
          Secure access to your FinPulse dashboard
        </p>
      </div>

      <div className="relative z-[2] my-10">
        {!showGoogle ? (
          <button
            type="button"
            onClick={launch}
            disabled={launching}
            className="group flex w-full items-center justify-center gap-3 overflow-hidden rounded-2xl border border-cyan-300/50 bg-[linear-gradient(135deg,rgba(0,242,254,0.8)_0%,rgba(14,165,233,0.8)_100%)] px-6 py-5 text-lg font-semibold text-white shadow-[0_10px_30px_rgba(0,242,254,0.3),inset_0_2px_0_rgba(255,255,255,0.3)] transition-all duration-300 hover:-translate-y-1 hover:bg-[linear-gradient(135deg,rgba(0,242,254,1)_0%,rgba(14,165,233,1)_100%)] hover:shadow-[0_15px_40px_rgba(0,242,254,0.5),inset_0_2px_0_rgba(255,255,255,0.4)] disabled:cursor-wait disabled:opacity-80"
          >
            {launching ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Initializing...</span>
              </>
            ) : (
              <>
                <span>Launch FinPulse</span>
                <Rocket className="h-5 w-5 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
              </>
            )}
          </button>
        ) : (
          <div className="animate-[slideLeft_0.5s_cubic-bezier(0.16,1,0.3,1)_forwards]">
            <div className="relative mb-6 text-sm font-medium text-slate-400 before:absolute before:left-0 before:top-1/2 before:h-px before:w-1/4 before:bg-white/[0.06] after:absolute after:right-0 after:top-1/2 after:h-px after:w-1/4 after:bg-white/[0.06]">
              Continue with
            </div>
            <button
              type="button"
              onClick={loginWithGoogle}
              disabled={authenticating}
            className="flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-200/80 bg-white/70 px-6 py-5 text-base font-semibold text-slate-900 shadow-[0_10px_30px_rgba(15,23,42,0.08)] transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white disabled:cursor-wait disabled:opacity-80 dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-slate-50 dark:shadow-none dark:hover:border-white/20 dark:hover:bg-white/[0.08]"
            >
              {authenticating ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-sm font-extrabold text-[#ea4335]">
                    G
                  </span>
                  <span>Google</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      <p className="relative z-[2] text-sm text-slate-600 dark:text-slate-400">
        By continuing, you agree to our{" "}
        <span className="font-semibold text-cyan-600 dark:text-cyan-300">Terms of Service</span>
      </p>

      {authenticating && (
        <div className="relative z-[2] mt-4 flex items-center justify-center gap-2 text-sm font-medium text-emerald-400">
          <Check className="h-4 w-4" />
          Redirecting securely...
        </div>
      )}

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes slideLeft {
          from { opacity: 0; transform: translateX(30px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
