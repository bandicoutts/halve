import { MessageScreen } from "@/components/ui/MessageScreen";

// Root not-found boundary. Renders for `notFound()` calls in any segment AND for
// any URL that matches no route. Server Component — no client hooks needed.
export default function NotFound() {
  return (
    <MessageScreen
      mark="ring"
      kicker="404 · NOT FOUND"
      headline="This page isn’t on the grid."
      body="The address doesn’t match anything we know — the puzzle may not be published yet, or the link is wrong."
      primary={{ label: "Back home", href: "/" }}
      secondary={{ label: "BROWSE THE ARCHIVE", href: "/archive" }}
    />
  );
}
