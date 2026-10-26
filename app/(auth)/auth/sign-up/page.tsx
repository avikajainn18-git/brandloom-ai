import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";
import { signUpAction } from "@/app/auth/actions";

export const metadata: Metadata = {
  title: "Sign up",
};

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const nextPath = params.next?.startsWith("/") && !params.next.startsWith("//")
    ? params.next
    : "/dashboard";

  return <AuthForm mode="sign-up" nextPath={nextPath} action={signUpAction} />;
}
