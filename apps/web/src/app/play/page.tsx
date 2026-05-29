import { generatePuzzle } from "@parity/engine";
import { BoardScreen } from "@/components/board/BoardScreen";

export const dynamic = "force-dynamic";

export default function PlayPage() {
  const puzzle = generatePuzzle({ size: 6, difficulty: "medium" });
  return <BoardScreen puzzle={puzzle} backHref="/" />;
}
