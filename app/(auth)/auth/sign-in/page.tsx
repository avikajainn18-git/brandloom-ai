import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";
import { signInAction } from "@/app/auth/actions";

export const metadata: Metadata = {
  title: "Sign in",
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const nextPath = params.next?.startsWith("/") && !params.next.startsWith("//")
    ? params.next
    : "/dashboard";

  return <AuthForm mode="sign-in" nextPath={nextPath} action={signInAction} />;
}
