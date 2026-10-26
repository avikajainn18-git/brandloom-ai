"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  ChevronRight,
  LayoutDashboard,
  Menu,
  Scale,
  ShieldCheck,
  X,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

type NavigationItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

const navigationItems: NavigationItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Campaigns", href: "/campaigns", icon: BookOpen },
  { label: "Brand References", href: "/brand-references", icon: ShieldCheck },
  { label: "Review Queue", href: "/review-queue", icon: Scale },
];

function BrandMark() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex size-9 items-center justify-center rounded-lg bg-[#252525] text-white">
        <span className="text-sm font-semibold tracking-[-0.08em]">B/</span>
      </div>
      <div>
        <p className="text-sm font-semibold tracking-[-0.01em] text-[#252525]">
          Brandloom AI
        </p>
        <p className="mt-0.5 text-[11px] text-[var(--muted)]">Brand governance</p>
      </div>
    </div>
  );
}

export function SidebarNav() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <header className="flex items-center justify-between border-b bg-[var(--surface)] px-5 py-4 md:hidden">
        <BrandMark />
        <button
          type="button"
          aria-expanded={isOpen}
          aria-controls="mobile-navigation"
          aria-label={isOpen ? "Close navigation" : "Open navigation"}
          className="inline-flex size-10 items-center justify-center rounded-lg border bg-white text-[#3c3c3a] transition-colors hover:bg-[var(--surface-subtle)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#252525]"
          onClick={() => setIsOpen((open) => !open)}
        >
          {isOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </header>

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r bg-[var(--surface)] md:block">
        <div className="flex h-full flex-col px-4 py-6">
          <div className="px-3">
            <BrandMark />
          </div>
          <NavigationList pathname={pathname} />
          <div className="mt-auto border-t px-3 pt-5">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#92928d]">
              Workspace
            </p>
            <p className="mt-2 text-xs leading-5 text-[var(--muted)]">
              Your campaign workspace is ready for setup.
            </p>
          </div>
        </div>
      </aside>

      {isOpen ? (
        <div
          id="mobile-navigation"
          className="border-b bg-[var(--surface)] px-5 pb-4 md:hidden"
        >
          <NavigationList pathname={pathname} onNavigate={() => setIsOpen(false)} />
        </div>
      ) : null}
    </>
  );
}

function NavigationList({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav aria-label="Main navigation" className="mt-10 space-y-1">
      {navigationItems.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            onClick={onNavigate}
            className={cn(
              "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#252525]",
              isActive
                ? "bg-[#252525] font-medium text-white"
                : "text-[#62625e] hover:bg-[var(--surface-subtle)] hover:text-[#252525]",
            )}
          >
            <Icon size={17} strokeWidth={isActive ? 2 : 1.8} />
            <span>{item.label}</span>
            <ChevronRight
              size={14}
              className={cn(
                "ml-auto opacity-0 transition-opacity group-hover:opacity-100",
                isActive && "opacity-100",
              )}
            />
          </Link>
        );
      })}
    </nav>
  );
}
