import { createContext, useContext } from "react";
import useBoard from "./useBoard";

const BoardContext = createContext(null);

export function BoardProvider({ rows, cols, gapPx, seed, children }) {
  const board = useBoard({ rows, cols, gapPx, seed }); // controller lives here
  return <BoardContext.Provider value={board}>{children}</BoardContext.Provider>;
}

export function useBoardContext() {
  const ctx = useContext(BoardContext);
  if (!ctx) throw new Error("useBoardContext must be used inside <BoardProvider>");
  return ctx;
}