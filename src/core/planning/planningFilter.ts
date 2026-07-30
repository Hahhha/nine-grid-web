import { pieceGoalScore } from "../shared/goal";
import type { PuzzlePiece } from "../../types/domain";
import type { PlanningGoal } from "../../types/planning";

export type PlanningFilterResult = {
  filtered: PuzzlePiece[];
  rawCount: number;
  filteredCount: number;
  excludedByElement: number;
  excludedByRarity: number;
  excludedByGoalScore: number;
};

export function planningScoreForPiece(piece: PuzzlePiece, goal: PlanningGoal): number {
  let score = pieceGoalScore(piece, goal) * 100;
  if (piece.rarity === "purple") score += 18;
  else if (piece.rarity === "blue") score += 12;
  if (piece.blueStat === "sameElementBoost") score += 8;
  const shapeBonus = { O: 4, I: 3, T: 2, L: 1, J: 0 }[piece.shape];
  score += shapeBonus;
  return score;
}

export function filterPlanningCandidates(candidates: PuzzlePiece[], goal: PlanningGoal): PlanningFilterResult {
  let excludedByElement = 0;
  let excludedByRarity = 0;
  let excludedByGoalScore = 0;

  const filtered = candidates
    .filter((piece) => {
      const keep = piece.element === goal.element;
      if (!keep) excludedByElement += 1;
      return keep;
    })
    .filter((piece) => {
      const keep = piece.rarity === "blue" || piece.rarity === "purple";
      if (!keep) excludedByRarity += 1;
      return keep;
    })
    .filter((piece) => {
      const keep = pieceGoalScore(piece, goal) > 0;
      if (!keep) excludedByGoalScore += 1;
      return keep;
    })
    .sort((a, b) => planningScoreForPiece(b, goal) - planningScoreForPiece(a, goal));

  return {
    filtered,
    rawCount: candidates.length,
    filteredCount: filtered.length,
    excludedByElement,
    excludedByRarity,
    excludedByGoalScore,
  };
}
