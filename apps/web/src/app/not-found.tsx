import { MessageScreen } from "@/components/ui/MessageScreen";

// Root not-found boundary. Renders for `notFound()` calls in any segment AND for
// any URL that matches no route. Server Component — no client hooks needed.
export default function NotFound() {
  return (
      <MessageScreen
        mark="ring"
        kicker="404 · NOT FOUND"
        headline="Page not found."
        body="The address does not match a page. The puzzle may not be published yet, or the link may be wrong."
      primary={{ label: "Back home", href: "/" }}
      secondary={{ label: "BROWSE THE ARCHIVE", href: "/archive" }}
    />
  );
}
