"use client";

export function ChartSkeleton() {
  return (
    <div className="relative h-[250px] w-full overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--item-hover)] p-6">
      <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-transparent via-primary/10 to-transparent" />
      <div className="flex h-full items-end justify-between gap-2 pt-8">
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="w-full max-w-[40px] rounded-t-md bg-gradient-to-t from-primary/25 to-primary/5"
            style={{ height: `${35 + (i % 4) * 15}%` }}
          />
        ))}
      </div>
      <div className="mt-4 h-2 w-1/3 rounded-full bg-[var(--border)]" />
    </div>
  );
}

