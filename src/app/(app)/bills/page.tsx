import { BillForm } from "@/components/forms/bill-form";
import { Receipt } from "lucide-react";

export default function BillsPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-xl bg-primary/10">
          <Receipt className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-[1.75rem] font-bold tracking-tight text-text-primary">Bill Payments</h1>
          <p className="text-text-tertiary text-sm mt-1">Pay utilities and registered billers</p>
        </div>
      </div>
      <BillForm />
    </div>
  );
}
