import type { Element, ElementSkill, PuzzlePiece, SubStat } from "./domain";

export type GoalCounts = {
  subStats: Partial<Record<SubStat, number>>;
  elementSkills: Partial<Record<ElementSkill, number>>;
  sameElementBoost: number;
};

export type PlanningGoal = {
  element: Element;
  counts: GoalCounts;
};

export type PlanningResult = {
  id: string;
  title: string;
  summary: string;
  diagnostics?: string;
  usingPieces: string[];
  missingShapes: string[];
  missingAttributes: string[];
  suggestedPieces: string[];
  replacementAdvice: string[];
  stats: {
    rawCandidates: number;
    filteredCandidates: number;
    enumerated9: number;
    enumerated8: number;
    enumerated7: number;
  };
};

export type CandidateCollection = PuzzlePiece[];
