import { MessageScreen } from "@/components/ui/MessageScreen";

// Root not-found boundary. Renders for `notFound()` calls in any segment AND for
// any URL that matches no route. Server Component — no client hooks needed.
export default function NotFound() {
  return (
      <MessageScreen
        mark="soft"
        kicker="404 · NOT FOUND"
        headline="Page not found."
        body="We couldn’t find that page. The link may be wrong, or that puzzle may not be available yet."
      primary={{ label: "Back home", href: "/" }}
      secondary={{ label: "BROWSE THE ARCHIVE", href: "/archive" }}
    />
  );
}
