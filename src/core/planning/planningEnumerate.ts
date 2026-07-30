import { PLANNING_GROUP_SIZES, PLANNING_SLOT_COUNT } from "./planningRules";
import type { PuzzlePiece } from "../../types/domain";

export type PlanningGroupSize = (typeof PLANNING_GROUP_SIZES)[number];

export type CandidateCombo = {
  selected: PuzzlePiece[];
  selectedCount: PlanningGroupSize;
};

export type EnumerateStats = {
  enumerated9: number;
  enumerated8: number;
  enumerated7: number;
  enumerated6: number;
  enumerated5: number;
  total: number;
};

export function enumeratePlanningCombos(pool: PuzzlePiece[]): { combos: CandidateCombo[]; stats: EnumerateStats } {
  const combos: CandidateCombo[] = [];
  const stats: EnumerateStats = {
    enumerated9: 0,
    enumerated8: 0,
    enumerated7: 0,
    enumerated6: 0,
    enumerated5: 0,
    total: 0,
  };

  const enumerateSize = (desired: PlanningGroupSize) => {
    if (desired > PLANNING_SLOT_COUNT || desired > pool.length) return;
    const indexes: number[] = [];
    const dfs = (start: number) => {
      if (indexes.length === desired) {
        const selected = indexes.map((index) => pool[index]);
        combos.push({ selected, selectedCount: desired });
        stats[`enumerated${desired}` as keyof EnumerateStats] += 1 as never;
        stats.total += 1;
        return;
      }
      const remainingNeeded = desired - indexes.length;
      for (let i = start; i <= pool.length - remainingNeeded; i += 1) {
        indexes.push(i);
        dfs(i + 1);
        indexes.pop();
      }
    };
    dfs(0);
  };

  PLANNING_GROUP_SIZES.forEach((size) => enumerateSize(size));
  return { combos, stats };
}
