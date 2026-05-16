import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth/options";
import { LoginForm } from "@/components/auth/login-form";
import { LoginThemeToggle } from "@/components/auth/login-theme-toggle";

export default async function LoginPage() {
  const session = await getServerSession(authOptions);
  if (session) redirect("/dashboard");

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-6 text-slate-950 transition-colors duration-500 dark:bg-[#020617] dark:text-slate-50">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[600px] w-[600px] animate-[float_25s_ease-in-out_infinite_alternate] rounded-full bg-cyan-300/35 blur-[140px] dark:bg-cyan-300/35" />
        <div className="absolute -bottom-52 -right-40 h-[700px] w-[700px] animate-[float_25s_ease-in-out_infinite_alternate] rounded-full bg-sky-400/30 blur-[140px] [animation-delay:-5s] dark:bg-sky-500/35" />
        <div className="absolute left-[40%] top-[30%] h-[500px] w-[500px] animate-[float_25s_ease-in-out_infinite_alternate] rounded-full bg-teal-300/25 blur-[140px] [animation-delay:-10s] dark:bg-teal-600/25" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.045)_1px,transparent_1px)] bg-[size:60px_60px] dark:bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)]" />
        <div className="absolute inset-0 bg-gradient-to-br from-white/70 via-transparent to-cyan-100/50 dark:from-transparent dark:to-transparent" />
      </div>

      <div className="pointer-events-none absolute left-0 top-1/2 z-[1] w-full -translate-y-1/2 overflow-hidden opacity-50">
        <div className="inline-block animate-[marquee_80s_linear_infinite] whitespace-nowrap bg-[linear-gradient(135deg,rgba(15,23,42,0.18)_0%,rgba(14,165,233,0.08)_100%)] bg-clip-text text-[14vw] font-extrabold tracking-[-0.05em] text-transparent [-webkit-text-stroke:1px_rgba(15,23,42,0.12)] dark:bg-[linear-gradient(135deg,rgba(255,255,255,0.4)_0%,rgba(255,255,255,0.05)_100%)] dark:[-webkit-text-stroke:1px_rgba(255,255,255,0.15)]">
          Next-gen banking for everyone. &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Next-gen banking for everyone.
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Next-gen banking for everyone. &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
          Next-gen banking for everyone. &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
        </div>
      </div>

      <div className="absolute left-6 top-6 z-20 flex items-center gap-3 text-xl font-bold tracking-[-0.03em] text-slate-900 md:left-12 md:top-10 md:text-2xl dark:text-slate-50">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-500/40 bg-white/50 text-cyan-600 shadow-[0_0_20px_rgba(0,180,216,0.18),inset_0_0_10px_rgba(0,180,216,0.12)] backdrop-blur-xl dark:border-cyan-300/40 dark:bg-transparent dark:text-cyan-300 dark:shadow-[0_0_20px_rgba(0,242,254,0.2),inset_0_0_10px_rgba(0,242,254,0.2)]">
          <span className="text-lg">⚡</span>
        </div>
        <span>FinPulse</span>
      </div>

      <div className="fixed top-4 right-4 z-50">
        <LoginThemeToggle />
      </div>

      <LoginForm />

      <style>{`
        @keyframes float {
          0% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(80px, 50px) scale(1.1); }
          100% { transform: translate(-50px, 80px) scale(0.9); }
        }

        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
