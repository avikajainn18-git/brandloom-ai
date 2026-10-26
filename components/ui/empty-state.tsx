import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  eyebrow,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "flex min-h-[320px] flex-col items-center justify-center rounded-xl border border-dashed bg-[var(--surface)] px-6 py-12 text-center",
        className,
      )}
    >
      <div className="flex size-12 items-center justify-center rounded-xl border bg-[var(--surface-subtle)] text-[#5f5f5b]">
        <Icon size={21} strokeWidth={1.7} />
      </div>
      <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8b8b85]">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-xl font-semibold tracking-[-0.025em] text-[#252525]">
        {title}
      </h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-[var(--muted)]">{description}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </section>
  );
}
