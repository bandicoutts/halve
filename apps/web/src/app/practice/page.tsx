import { PracticeScreen } from "@/components/screens/PracticeScreen";
import { getHeaderAuth } from "@/lib/header-auth";

export default async function PracticePage() {
  const { isAuthenticated, displayName } = await getHeaderAuth();
  return <PracticeScreen isAuthenticated={isAuthenticated} displayName={displayName} />;
}
