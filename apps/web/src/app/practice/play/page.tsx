import { Suspense } from "react";
import { PracticePlayClient } from "@/components/screens/PracticePlayClient";
import { BoardSkeleton } from "@/components/board/BoardSkeleton";

export default function PracticePlayPage() {
  return (
    <Suspense fallback={<BoardSkeleton />}>
      <PracticePlayClient />
    </Suspense>
  );
}
