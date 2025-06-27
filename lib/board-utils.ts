/**
 * @file board-utils.ts
 * @description Utility functions for board operations
 */

import type { Board } from "@/lib/default-boards-data"

// Utility function to ensure boards are sorted by order and have order values
export const ensureBoardOrder = (boards: Board[]): Board[] => {
  return boards
    .map((board, index) => ({
      ...board,
      order: board.order !== undefined ? board.order : index
    }))
    .sort((a, b) => a.order - b.order)
}