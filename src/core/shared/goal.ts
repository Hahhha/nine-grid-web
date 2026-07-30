import { ELEMENT_LABELS } from "../../data/elements";
import type { PuzzlePiece } from "../../types/domain";
import type { PlanningGoal } from "../../types/planning";

export function effectiveCountsForPieces(pieces: PuzzlePiece[], goal: PlanningGoal): Record<string, number> {
  const counts: Record<string, number> = {};
  const sameElementBoostName = `${ELEMENT_LABELS[goal.element]}增强`;

  const bump = (name?: string | null) => {
    if (!name) return;
    counts[name] = (counts[name] ?? 0) + 1;
  };

  pieces.forEach((piece) => {
    bump(piece.subStat);
    bump(piece.greenSkill);
    bump(piece.purpleSkill);
    if (piece.blueStat === "sameElementBoost") bump(sameElementBoostName);
  });

  return counts;
}

export function goalEntries(goal: PlanningGoal): { name: string; count: number }[] {
  const entries: { name: string; count: number }[] = [];

  Object.entries(goal.counts.subStats).forEach(([name, count]) => {
    if ((count ?? 0) > 0) entries.push({ name, count: count ?? 0 });
  });
  Object.entries(goal.counts.elementSkills).forEach(([name, count]) => {
    if ((count ?? 0) > 0) entries.push({ name, count: count ?? 0 });
  });

  const sameElementBoostName = `${ELEMENT_LABELS[goal.element]}增强`;
  if (goal.counts.sameElementBoost > 0) {
    entries.push({ name: sameElementBoostName, count: goal.counts.sameElementBoost });
  }

  return entries;
}

export function deficitsForPieces(pieces: PuzzlePiece[], goal: PlanningGoal): Record<string, number> {
  const counts = effectiveCountsForPieces(pieces, goal);
  const deficits: Record<string, number> = {};
  goalEntries(goal).forEach((entry) => {
    const have = counts[entry.name] ?? 0;
    const need = entry.count - have;
    if (need > 0) deficits[entry.name] = need;
  });
  return deficits;
}

export function pieceGoalScore(piece: PuzzlePiece, goal: PlanningGoal): number {
  const counts = effectiveCountsForPieces([piece], goal);
  return goalEntries(goal).reduce((sum, entry) => sum + Math.min(counts[entry.name] ?? 0, entry.count), 0);
}

export function remainingDeficitTotal(deficits: Record<string, number>): number {
  return Object.values(deficits).reduce((sum, count) => sum + Math.max(0, count), 0);
}

export function deficitSummary(deficits: Record<string, number>): string {
  const parts = Object.entries(deficits)
    .filter(([, count]) => count > 0)
    .sort(([a], [b]) => a.localeCompare(b, "zh-CN"))
    .map(([name, count]) => `${name}×${count}`);
  return parts.length > 0 ? parts.join("、") : "无";
}
