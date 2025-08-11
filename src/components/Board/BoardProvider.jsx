import { BoardContext } from "./BoardContext";
import useBoard from "./useBoard";

export function BoardProvider({ rows, cols, gapPx, seed, children }) {
  const board = useBoard({ rows, cols, gapPx, seed }); // controller lives here
  return <BoardContext.Provider value={board}>{children}</BoardContext.Provider>;
}