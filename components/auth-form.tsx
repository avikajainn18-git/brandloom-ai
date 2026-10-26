"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { AuthActionState } from "@/app/auth/actions";

type AuthMode = "sign-in" | "sign-up";
type AuthAction = (
  previousState: AuthActionState,
  formData: FormData,
) => Promise<AuthActionState>;

export function AuthForm({ mode, nextPath, action }: { mode: AuthMode; nextPath: string; action: AuthAction }) {
  const [state, formAction, isPending] = useActionState(action, {});
  const isSignIn = mode === "sign-in";

  return (
    <div className="w-full max-w-md rounded-2xl border bg-white p-7 shadow-[0_18px_50px_rgba(30,30,28,0.06)] sm:p-9">
      <div className="flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-lg bg-[#252525] text-sm font-semibold tracking-[-0.08em] text-white">
          B/
        </div>
        <div>
          <p className="text-sm font-semibold text-[#252525]">Brandloom AI</p>
          <p className="text-[11px] text-[var(--muted)]">Brand governance</p>
        </div>
      </div>
      <div className="mt-10">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8b8b85]">
          Secure workspace
        </p>
        <h1 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-[#252525]">
          {isSignIn ? "Sign in to Brandloom AI" : "Create your account"}
        </h1>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          {isSignIn
            ? "Access your campaign governance workspace."
            : "Set up an account to manage your campaign workspace."}
        </p>
      </div>

      <form action={formAction} className="mt-8 space-y-5">
        <input type="hidden" name="next" value={nextPath} />
        <label className="block text-sm font-medium text-[#3c3c3a]">
          Email address
          <input
            required
            name="email"
            type="email"
            autoComplete="email"
            className="mt-2 block w-full rounded-lg border bg-[#fcfcfb] px-3.5 py-3 text-sm text-[#252525] outline-none transition-colors placeholder:text-[#a3a39d] focus:border-[#252525] focus:ring-2 focus:ring-[#252525]/10"
            placeholder="you@company.com"
          />
        </label>
        <label className="block text-sm font-medium text-[#3c3c3a]">
          Password
          <input
            required
            minLength={6}
            name="password"
            type="password"
            autoComplete={isSignIn ? "current-password" : "new-password"}
            className="mt-2 block w-full rounded-lg border bg-[#fcfcfb] px-3.5 py-3 text-sm text-[#252525] outline-none transition-colors placeholder:text-[#a3a39d] focus:border-[#252525] focus:ring-2 focus:ring-[#252525]/10"
            placeholder="At least 6 characters"
          />
        </label>
        {state.error ? (
          <p role="alert" className="rounded-lg border border-[#e4caca] bg-[#fff8f8] px-3 py-2.5 text-sm text-[#8d3f3f]">
            {state.error}
          </p>
        ) : null}
        {state.message ? (
          <p role="status" className="rounded-lg border border-[#d5ded4] bg-[#f6faf5] px-3 py-2.5 text-sm text-[#456044]">
            {state.message}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex w-full items-center justify-center rounded-lg bg-[#252525] px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-[#41413e] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#252525]"
        >
          {isPending ? "Please wait…" : isSignIn ? "Sign in" : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-[var(--muted)]">
        {isSignIn ? "Need an account? " : "Already have an account? "}
        <Link
          href={`${isSignIn ? "/auth/sign-up" : "/auth/sign-in"}?next=${encodeURIComponent(nextPath)}`}
          className="font-medium text-[#252525] underline underline-offset-4"
        >
          {isSignIn ? "Sign up" : "Sign in"}
        </Link>
      </p>
    </div>
  );
}
