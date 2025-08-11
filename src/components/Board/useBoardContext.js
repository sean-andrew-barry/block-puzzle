import { useContext } from "react";
import { BoardContext } from "./BoardContext";

export function useBoardContext() {
  const ctx = useContext(BoardContext);
  if (!ctx) throw new Error("useBoardContext must be used inside <BoardProvider>");
  return ctx;
}