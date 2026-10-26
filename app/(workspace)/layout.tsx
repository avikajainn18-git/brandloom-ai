import { AppShell } from "@/components/app-shell";
import { getAuthenticatedUser } from "@/lib/auth/server";
import { redirect } from "next/navigation";

export default async function WorkspaceLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/auth/sign-in");
  }

  return <AppShell userEmail={user.email ?? "Signed-in user"}>{children}</AppShell>;
}
