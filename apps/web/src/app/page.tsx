import { generatePuzzle } from "@parity/engine";
import { BoardScreen } from "@/components/board/BoardScreen";

export default function Home() {
  const puzzle = generatePuzzle({ size: 6, difficulty: "medium" });
  return <BoardScreen puzzle={puzzle} />;
}
