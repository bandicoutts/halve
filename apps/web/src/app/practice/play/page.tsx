import { Suspense } from "react";
import { PracticePlayClient } from "@/components/screens/PracticePlayClient";

function Loading() {
  return (
    <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>
      <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--fg-3)" }}>
        Generating…
      </div>
    </div>
  );
}

export default function PracticePlayPage() {
  return (
    <Suspense fallback={<Loading />}>
      <PracticePlayClient />
    </Suspense>
  );
}
