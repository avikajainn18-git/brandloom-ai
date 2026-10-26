"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AuthActionState = {
  error?: string;
  message?: string;
};

function readCredentials(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !email.includes("@")) {
    return { error: "Enter a valid email address." } as const;
  }

  if (password.length < 6) {
    return { error: "Password must be at least 6 characters." } as const;
  }

  return { email, password } as const;
}

function getSafeNextPath(formData: FormData) {
  const next = String(formData.get("next") ?? "");
  return next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
}

export async function signInAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const credentials = readCredentials(formData);
  if ("error" in credentials) return credentials;

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword(credentials);

  if (error) {
    return { error: "We could not sign you in. Check your email and password." };
  }

  redirect(getSafeNextPath(formData));
}

export async function signUpAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const credentials = readCredentials(formData);
  if ("error" in credentials) return credentials;

  const requestHeaders = await headers();
  const origin = requestHeaders.get("origin") ?? "http://localhost:3000";
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    ...credentials,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(
        getSafeNextPath(formData),
      )}`,
    },
  });

  if (error) {
    return { error: "We could not create your account. Check the details and try again." };
  }

  if (data.session) {
    redirect(getSafeNextPath(formData));
  }

  return {
    message: "Account created. Check your email to confirm your address before signing in.",
  };
}

export async function signOutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/auth/sign-in");
}
