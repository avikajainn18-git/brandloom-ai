import Link from "next/link";
import { cn } from "@/lib/utils";

const baseStyles =
  "inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#252525]";

export function Button({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(baseStyles, "bg-[#252525] text-white hover:bg-[#41413e]", className)}
    >
      {children}
    </Link>
  );
}
