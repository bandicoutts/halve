import { AuthScreen } from "@/components/screens/AuthScreen";

export default async function AuthPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const initialError =
    params.error === "callback"
      ? "That sign-in link has expired or was already used. Try again."
      : undefined;
  return <AuthScreen initialError={initialError} />;
}
