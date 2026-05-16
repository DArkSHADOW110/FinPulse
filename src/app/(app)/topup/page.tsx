import { TopupForm } from "@/components/forms/topup-form";
import { Smartphone } from "lucide-react";

export default function TopupPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-xl bg-primary/10">
          <Smartphone className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-[1.75rem] font-bold tracking-tight text-text-primary">Mobile Top-up</h1>
          <p className="text-text-tertiary text-sm mt-1">Reload prepaid numbers from your linked account</p>
        </div>
      </div>
      <TopupForm />
    </div>
  );
}
