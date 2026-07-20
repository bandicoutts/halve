import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AuthScreen } from "@/components/screens/AuthScreen";

export default async function AuthPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; mode?: string }>;
}) {
  const params = await searchParams;
  const setPasswordMode = params.mode === "password";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Signed-in visitors don't need the sign-in form — except the one flow that
  // requires an existing session: setting a password on an account created via
  // magic link (there's no separate account-settings page on web for this yet).
  if (user && !setPasswordMode) redirect("/");
  if (!user && setPasswordMode) redirect("/auth");

  const initialError =
    params.error === "callback"
      ? "That sign-in link has expired or was already used. Try again."
      : undefined;
  return <AuthScreen initialError={initialError} setPasswordMode={setPasswordMode} />;
}
