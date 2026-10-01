type ShareOutcome = "shared" | "copied" | "cancelled" | "failed";

interface ShareActions {
  share?: ((data: { text: string }) => Promise<void>) | undefined;
  writeText?: ((text: string) => Promise<void>) | undefined;
}

/** Cancellation is intentional; other native-share failures can fall back to copy. */
export async function shareResult(text: string, actions: ShareActions): Promise<ShareOutcome> {
  if (actions.share) {
    try {
      await actions.share({ text });
      return "shared";
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return "cancelled";
    }
  }
  if (actions.writeText) {
    try {
      await actions.writeText(text);
      return "copied";
    } catch {
      return "failed";
    }
  }
  return "failed";
}
