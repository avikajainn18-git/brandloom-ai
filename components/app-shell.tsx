import { SidebarNav } from "@/components/sidebar-nav";
import { signOutAction } from "@/app/auth/actions";

export function AppShell({
  children,
  userEmail,
}: {
  children: React.ReactNode;
  userEmail: string;
}) {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <SidebarNav />
      <main className="min-h-screen md:pl-64">
        <div className="mx-auto min-h-screen w-full max-w-[1440px] px-5 py-5 sm:px-8 sm:py-8 lg:px-12">
          <div className="mb-7 flex items-center justify-end gap-3 border-b pb-4 sm:mb-8">
            <span className="max-w-[15rem] truncate text-xs text-[var(--muted)]" title={userEmail}>
              {userEmail}
            </span>
            <form action={signOutAction}>
              <button
                type="submit"
                className="rounded-md px-2 py-1 text-xs font-medium text-[#5f5f5b] underline-offset-4 transition-colors hover:text-[#252525] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#252525]"
              >
                Sign out
              </button>
            </form>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
