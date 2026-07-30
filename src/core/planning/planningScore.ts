import { ELEMENT_LABELS, ELEMENT_SKILLS } from "../../data/elements";
import { LEGAL_SHAPE_TARGETS, type ShapeTarget } from "../../data/legalShapeTargets";
import { SUBSTAT_LABELS } from "../../data/options";
import type { ElementSkill, PuzzlePiece, Shape, SubStat } from "../../types/domain";
import type { PlanningGoal, PlanningResult } from "../../types/planning";
import { deficitSummary, deficitsForPieces, remainingDeficitTotal } from "../shared/goal";
import { pieceSummary, shapeCountsForPieces, SHAPE_ORDER } from "../shared/piece";
import type { CandidateCombo, EnumerateStats } from "./planningEnumerate";
import { PLANNING_GROUP_SIZES, PLANNING_RESULT_LIMIT, PLANNING_SLOT_COUNT } from "./planningRules";

type InternalPlan = PlanningResult & {
  selectedCount: number;
  missingCount: number;
  isFallback: boolean;
  fillerCount: number;
  selectedQuality: number;
  targetSpread: number;
};

function displayNameForGoal(goalName: string): string {
  if (goalName in SUBSTAT_LABELS) return SUBSTAT_LABELS[goalName as keyof typeof SUBSTAT_LABELS];
  return goalName;
}

function detailedDeficitLines(deficits: Record<string, number>): string[] {
  return Object.entries(deficits)
    .filter(([, count]) => count > 0)
    .sort(([a], [b]) => a.localeCompare(b, "zh-CN"))
    .map(([name, count]) => `${displayNameForGoal(name)} ×${count}`);
}

function consumeLargestDeficit(deficits: Record<string, number>, candidates: string[], fallback?: string): string | undefined {
  let best: string | undefined;
  let bestValue = 0;
  candidates.forEach((name) => {
    const value = deficits[name] ?? 0;
    if (value > bestValue) {
      best = name;
      bestValue = value;
    }
  });
  if (best && bestValue > 0) {
    deficits[best] = bestValue - 1;
    return best;
  }
  return fallback;
}

function recommendedPiecesForDeficits(deficitsInput: Record<string, number>, room: number, goal: PlanningGoal): PuzzlePiece[] {
  const deficits = { ...deficitsInput };
  const pieces: PuzzlePiece[] = [];
  const skills = ELEMENT_SKILLS[goal.element];
  const elementLabel = ELEMENT_LABELS[goal.element];
  const enhancementName = `${elementLabel}增强`;
  const subStatKeys = Object.keys(goal.counts.subStats);

  while (remainingDeficitTotal(deficits) > 0 && pieces.length < room) {
    const subStat = consumeLargestDeficit(deficits, subStatKeys, "crit") as SubStat;
    const greenSkill = consumeLargestDeficit(deficits, [...skills], skills[0]) as ElementSkill;
    const useEnhancement = (deficits[enhancementName] ?? 0) > 0;
    if (useEnhancement) deficits[enhancementName] -= 1;
    const purpleSkill = consumeLargestDeficit(deficits, [...skills]);
    pieces.push({
      id: `suggest-${pieces.length}`,
      shape: "O",
      rarity: purpleSkill ? "purple" : "blue",
      element: goal.element,
      subStat,
      greenSkill,
      blueStat: useEnhancement ? "sameElementBoost" : "anyResistance",
      purpleSkill: purpleSkill as PuzzlePiece["purpleSkill"],
    });
  }

  return pieces;
}

function selectedQualityScore(pieces: PuzzlePiece[]): number {
  return pieces.reduce((sum, piece) => {
    let score = 0;
    if (piece.rarity === "purple") score += 4;
    else if (piece.rarity === "blue") score += 2;
    if (piece.blueStat === "sameElementBoost") score += 2;
    if (piece.purpleSkill) score += 2;
    return sum + score;
  }, 0);
}

function replacementPieceSummaryForDeficits(deficits: Record<string, number>, count: number, goal: PlanningGoal): string[] {
  const remaining = { ...deficits };
  const pieces = recommendedPiecesForDeficits(remaining, Math.max(1, count), goal);
  return pieces.map((piece) => pieceSummary(piece, ELEMENT_LABELS[goal.element]));
}

function targetCanCoverSelected(target: ShapeTarget, selectedCounts: Record<Shape, number>): boolean {
  return SHAPE_ORDER.every((shape) => selectedCounts[shape] <= target[shape]);
}

function missingShapeList(target: ShapeTarget, selectedCounts: Record<Shape, number>): Shape[] {
  const missing: Shape[] = [];
  SHAPE_ORDER.forEach((shape) => {
    const need = target[shape] - selectedCounts[shape];
    for (let i = 0; i < need; i += 1) missing.push(shape);
  });
  return missing;
}

function legalTargetsForSelected(selected: PuzzlePiece[]): ShapeTarget[] {
  const selectedCounts = shapeCountsForPieces(selected);
  return LEGAL_SHAPE_TARGETS.filter((target) => targetCanCoverSelected(target, selectedCounts)).sort((a, b) => {
    const missingA = missingShapeList(a, selectedCounts).length;
    const missingB = missingShapeList(b, selectedCounts).length;
    if (missingA !== missingB) return missingA - missingB;
    const spreadA = SHAPE_ORDER.filter((shape) => a[shape] > 0).length;
    const spreadB = SHAPE_ORDER.filter((shape) => b[shape] > 0).length;
    if (spreadA !== spreadB) return spreadA - spreadB;
    const oBiasA = a.O;
    const oBiasB = b.O;
    if (oBiasA !== oBiasB) return oBiasA - oBiasB;
    return JSON.stringify(a).localeCompare(JSON.stringify(b), "zh-CN");
  });
}

function shapeNeedSummary(shapes: Shape[]): string[] {
  const counts: Record<Shape, number> = { O: 0, I: 0, T: 0, L: 0, J: 0 };
  shapes.forEach((shape) => {
    counts[shape] += 1;
  });
  return SHAPE_ORDER.filter((shape) => counts[shape] > 0).map((shape) => `${shape} 形状 ×${counts[shape]}`);
}

function shapeNeedSummaryFromPieces(pieces: PuzzlePiece[]): string[] {
  return shapeNeedSummary(pieces.map((piece) => piece.shape));
}

function dedupePlans(plans: InternalPlan[]): InternalPlan[] {
  const seen = new Set<string>();
  return plans.filter((plan) => {
    const key = `${plan.title}|${plan.summary}|${plan.usingPieces.join(";")}|${plan.missingShapes.join(";")}|${plan.missingAttributes.join(";")}|${plan.suggestedPieces.join(";")}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function compactUseSummary(selectedCount: number, missingPieces: number, fillerCount: number): string {
  const parts = [`使用现有 ${selectedCount} 块`];
  if (missingPieces > 0) parts.push(`补目标拼图 ${missingPieces} 块`);
  if (fillerCount > 0) parts.push(`补任意蓝色 ${fillerCount} 块`);
  return parts.join(" · ");
}

export function runPlanning(
  goal: PlanningGoal,
  combos: CandidateCombo[],
  candidates: PuzzlePiece[],
  filterStats: {
    rawCount: number;
    filteredCount: number;
    excludedByElement?: number;
    excludedByRarity?: number;
    excludedByGoalScore?: number;
  },
  enumerateStats: EnumerateStats,
): PlanningResult[] {
  const successful = new Map<number, InternalPlan[]>();
  const fallback = new Map<number, InternalPlan[]>();
  let checked = 0;
  let attributeRejected = 0;
  let shapeRejected = 0;

  combos.forEach((combo) => {
    checked += 1;
    const selected = combo.selected;
    const selectedCount = combo.selectedCount;
    const room = PLANNING_SLOT_COUNT - selectedCount;
    const deficits = deficitsForPieces(selected, goal);
    const newPieces = recommendedPiecesForDeficits(deficits, room, goal);
    const remaining = remainingDeficitTotal(deficits);
    const deficitLines = detailedDeficitLines(deficits);

    if (remaining > 0) {
      attributeRejected += 1;
      const plan: InternalPlan = {
        id: `fallback-attr-${checked}`,
        title: `候选 ${selectedCount} 个后仍不够属性`,
        summary: `属性未满足 · 剩余位置 ${room} 个 · 还差 ${deficitSummary(deficits)} · ${compactUseSummary(selectedCount, newPieces.length, 0)}`,
        diagnostics: `原始候选 ${filterStats.rawCount} 个 · 预排除后 ${filterStats.filteredCount} 个 · 已检查 ${checked} 组`,
        usingPieces: selected.slice(0, 6).map((piece) => pieceSummary(piece, ELEMENT_LABELS[goal.element])),
        missingShapes: room > 0 ? shapeNeedSummaryFromPieces(newPieces) : ["当前已无空位，只能替换现有拼图"],
        missingAttributes: deficitLines.length > 0 ? deficitLines : ["无"],
        suggestedPieces:
          newPieces.length > 0
            ? newPieces.map((piece) => pieceSummary(piece, ELEMENT_LABELS[goal.element]))
            : ["需要替换现有拼图来补足属性"],
        replacementAdvice:
          room > 0
            ? ["先补当前缺口最大的词条，再按剩余形状缺口选择 O / T / L 这类更灵活的拼图"]
            : replacementPieceSummaryForDeficits(deficits, Math.min(3, Math.max(1, remaining)), goal),
        stats: {
          rawCandidates: filterStats.rawCount,
          filteredCandidates: filterStats.filteredCount,
          enumerated9: enumerateStats.enumerated9,
          enumerated8: enumerateStats.enumerated8,
          enumerated7: enumerateStats.enumerated7,
        },
        selectedCount,
        missingCount: newPieces.length + remaining,
        isFallback: true,
        fillerCount: 0,
        selectedQuality: selectedQualityScore(selected),
        targetSpread: 0,
      };
      fallback.set(selectedCount, [...(fallback.get(selectedCount) ?? []), plan]);
      return;
    }

    const legalTargets = legalTargetsForSelected(selected);
    if (legalTargets.length === 0) {
      shapeRejected += 1;
      const plan: InternalPlan = {
        id: `fallback-shape-${checked}`,
        title: `候选 ${selectedCount} 个后没有匹配到合法配比`,
        summary: "属性满足，但当前形状数量落不到已缓存的合法配比。",
        diagnostics: `原始候选 ${filterStats.rawCount} 个 · 预排除后 ${filterStats.filteredCount} 个 · 已检查 ${checked} 组`,
        usingPieces: selected.slice(0, 6).map((piece) => pieceSummary(piece, ELEMENT_LABELS[goal.element])),
        missingShapes: ["需要换入更合适的形状组合"],
        missingAttributes: ["无"],
        suggestedPieces: ["优先补 O / T / L 这类更灵活的目标拼图，尽量别继续堆单一形状"],
        replacementAdvice: ["优先替换形状重复且贡献边缘的候选拼图"],
        stats: {
          rawCandidates: filterStats.rawCount,
          filteredCandidates: filterStats.filteredCount,
          enumerated9: enumerateStats.enumerated9,
          enumerated8: enumerateStats.enumerated8,
          enumerated7: enumerateStats.enumerated7,
        },
        selectedCount,
        missingCount: room,
        isFallback: true,
        fillerCount: 0,
        selectedQuality: selectedQualityScore(selected),
        targetSpread: 0,
      };
      fallback.set(selectedCount, [...(fallback.get(selectedCount) ?? []), plan]);
      return;
    }

    legalTargets.slice(0, 5).forEach((target, targetIndex) => {
      const missingShapes = missingShapeList(target, shapeCountsForPieces(selected));
      const shapedSuggestions = newPieces.map((piece, index) => ({ ...piece, shape: missingShapes[index] ?? "O" }));
      const fillerCount = Math.max(0, missingShapes.length - shapedSuggestions.length);
      const remainingDeficitsAfterSuggestion = deficitsForPieces([...selected, ...shapedSuggestions], goal);
      const targetSpread = SHAPE_ORDER.filter((shape) => target[shape] > 0).length;
      const plan: InternalPlan = {
        id: `success-${checked}-${targetIndex}`,
        title: `候选 ${selectedCount} 个 + 还缺 ${shapedSuggestions.length} 个`,
        summary: `合法配比成立 · 属性满足 · 未采用候选 ${Math.max(0, candidates.length - selectedCount)} 个 · ${compactUseSummary(selectedCount, shapedSuggestions.length, fillerCount)}`,
        diagnostics: `原始候选 ${filterStats.rawCount} 个 · 预排除后 ${filterStats.filteredCount} 个 · 已检查 ${checked} 组`,
        usingPieces: selected.slice(0, 8).map((piece) => pieceSummary(piece, ELEMENT_LABELS[goal.element])),
        missingShapes: shapeNeedSummary(missingShapes),
        missingAttributes: detailedDeficitLines(remainingDeficitsAfterSuggestion).length > 0 ? detailedDeficitLines(remainingDeficitsAfterSuggestion) : ["无"],
        suggestedPieces: shapedSuggestions.length > 0 ? shapedSuggestions.map((piece) => pieceSummary(piece, ELEMENT_LABELS[goal.element])) : ["不缺目标拼图"],
        replacementAdvice:
          fillerCount > 0
            ? [`还需要 ${fillerCount} 个任意蓝色补位拼图`, "补位拼图优先选择不干扰目标属性的蓝色任意抵抗"]
            : ["优先使用现有候选即可"],
        stats: {
          rawCandidates: filterStats.rawCount,
          filteredCandidates: filterStats.filteredCount,
          enumerated9: enumerateStats.enumerated9,
          enumerated8: enumerateStats.enumerated8,
          enumerated7: enumerateStats.enumerated7,
        },
        selectedCount,
        missingCount: shapedSuggestions.length,
        isFallback: false,
        fillerCount,
        selectedQuality: selectedQualityScore(selected),
        targetSpread,
      };
      successful.set(selectedCount, [...(successful.get(selectedCount) ?? []), plan]);
    });
  });

  const sortPlans = (plans: InternalPlan[]) =>
    dedupePlans(plans).sort((a, b) => {
      if (a.selectedCount !== b.selectedCount) return b.selectedCount - a.selectedCount;
      if (a.missingCount !== b.missingCount) return a.missingCount - b.missingCount;
      if (a.fillerCount !== b.fillerCount) return a.fillerCount - b.fillerCount;
      if (a.selectedQuality !== b.selectedQuality) return b.selectedQuality - a.selectedQuality;
      if (a.targetSpread !== b.targetSpread) return a.targetSpread - b.targetSpread;
      return a.title.localeCompare(b.title, "zh-CN");
    });

  const results: InternalPlan[] = [];
  const source = successful.size > 0 ? successful : fallback;
  PLANNING_GROUP_SIZES.forEach((size) => {
    const bucket = sortPlans(source.get(size) ?? []);
    bucket.forEach((plan) => {
      if (results.length < PLANNING_RESULT_LIMIT) results.push(plan);
    });
  });

  if (results.length === 0) {
    return [
      {
        id: "planning-empty",
        title: "当前无法组成完整站位",
        summary: `已检查 ${checked} 组候选；属性不足 ${attributeRejected} 组；合法配比未过 ${shapeRejected} 组。`,
        diagnostics: `原始候选 ${filterStats.rawCount} 个 · 预排除后 ${filterStats.filteredCount} 个 · 全量穷举 ${enumerateStats.total} 组（9/8/7）`,
        usingPieces: ["请减少冲突候选，或进一步收紧目标。"],
        missingShapes: ["待补形状未知"],
        missingAttributes: ["请先至少设置 1 条目标属性并加入有效候选"],
        suggestedPieces: ["后续可补更贴近目标的蓝/紫拼图"],
        replacementAdvice: ["优先删除对当前目标贡献为 0 的候选"],
        stats: {
          rawCandidates: filterStats.rawCount,
          filteredCandidates: filterStats.filteredCount,
          enumerated9: enumerateStats.enumerated9,
          enumerated8: enumerateStats.enumerated8,
          enumerated7: enumerateStats.enumerated7,
        },
      },
    ];
  }

  if (results[0]) {
    results[0] = {
      ...results[0],
      diagnostics: `原始候选 ${filterStats.rawCount} 个 · 预排除后 ${filterStats.filteredCount} 个 · 全量穷举 ${enumerateStats.total} 组（9/8/7） · 已检查 ${checked} 组 · 属性淘汰 ${attributeRejected} 组 · 配比淘汰 ${shapeRejected} 组`,
    };
  }

  return results.map(({ selectedCount: _selectedCount, missingCount: _missingCount, isFallback: _isFallback, ...plan }) => plan);
}
