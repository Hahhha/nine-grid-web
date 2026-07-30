import { SHAPE_LABELS } from "../../data/options";
import type { Shape } from "../../types/domain";
import type { PlacementSearchResult, PlacementSolution } from "../../types/placement";
import { BOARD_CELL_COUNT, cellsAreFree, freeCellCount, INDEX_TO_SHAPE, occupiedCellsForShape, remainingPlaceableShapeTypes, SHAPE_TO_INDEX } from "./board";

type StepPlacement = {
  label: string;
  cells: number[];
};

function shapeIndexesForInput(shapes: Shape[]): number[] {
  return shapes.map((shape) => SHAPE_TO_INDEX[shape]);
}

function stepLabel(shapeIndex: number, rotation: number): string {
  const shape = INDEX_TO_SHAPE[shapeIndex];
  return `${shape}${rotation === 0 ? "" : `@${rotation * 90}°`}`;
}

function addPlacementSolution(
  steps: string[],
  stepPlacements: StepPlacement[],
  occupied: Set<number>,
  requestedCount: number,
  solutions: PlacementSolution[],
  permanentLine: string,
  permanentAnchor: number,
  permanentCells: number[],
  candidateShapeIndexes: number[],
) {
  const flex = remainingPlaceableShapeTypes(occupied, candidateShapeIndexes);
  const free = freeCellCount(occupied);
  if (steps.length < requestedCount && free > 0 && flex === 0) return;
  const skipped = Math.max(0, requestedCount - steps.length);
  const line = `${permanentLine}；${steps.length > 0 ? steps.join(" → ") : "不新增"}；跳过 ${skipped} 块；剩余可容纳输入形状 ${flex} 类`;
  const solution: PlacementSolution = {
    id: `${permanentLine}-${steps.join("|")}-${flex}`,
    placed: steps.length,
    flex,
    skipped,
    permanentAnchor,
    steps: [...steps],
    occupiedCells: [
      { label: "永久 O", cells: [...permanentCells], kind: "permanent" },
      ...stepPlacements.map((item) => ({ ...item, kind: "piece" as const })),
    ],
    line,
  };
  if (!solutions.find((item) => item.line === solution.line)) solutions.push(solution);
}

function searchPlacementsRecursive(
  shapeIndexes: number[],
  index: number,
  occupied: Set<number>,
  steps: string[],
  stepPlacements: StepPlacement[],
  solutions: PlacementSolution[],
  limit: number,
  permanentLine: string,
  permanentAnchor: number,
  permanentCells: number[],
  candidateShapeIndexes: number[],
) {
  if (solutions.length >= limit) return;
  if (index >= shapeIndexes.length) {
    addPlacementSolution(steps, stepPlacements, occupied, shapeIndexes.length, solutions, permanentLine, permanentAnchor, permanentCells, candidateShapeIndexes);
    return;
  }

  const shapeIndex = shapeIndexes[index];
  for (let anchor = 0; anchor < BOARD_CELL_COUNT; anchor += 1) {
    for (let rotation = 0; rotation < 4; rotation += 1) {
      const cells = occupiedCellsForShape(shapeIndex, rotation, anchor);
      if (!cellsAreFree(cells, occupied)) continue;
      cells!.forEach((cell) => occupied.add(cell));
      const label = stepLabel(shapeIndex, rotation);
      steps.push(label);
      stepPlacements.push({ label, cells: [...cells!] });
      searchPlacementsRecursive(shapeIndexes, index + 1, occupied, steps, stepPlacements, solutions, limit, permanentLine, permanentAnchor, permanentCells, candidateShapeIndexes);
      stepPlacements.pop();
      steps.pop();
      cells!.forEach((cell) => occupied.delete(cell));
    }
  }

  searchPlacementsRecursive(shapeIndexes, index + 1, occupied, steps, stepPlacements, solutions, limit, permanentLine, permanentAnchor, permanentCells, candidateShapeIndexes);
}

export function searchPlacementSolutions(shapes: Shape[], limit = 5): PlacementSearchResult {
  const shapeIndexes = shapeIndexesForInput(shapes);
  const solutions: PlacementSolution[] = [];
  let permanentAttempts = 0;

  for (let anchor = 0; anchor < BOARD_CELL_COUNT && solutions.length < limit; anchor += 1) {
    const permanentCells = occupiedCellsForShape(0, 0, anchor);
    if (!permanentCells) continue;
    permanentAttempts += 1;
    const occupied = new Set<number>();
    permanentCells.forEach((cell) => occupied.add(cell));
    const permanentLine = `永久 O：位置 ${anchor + 1}`;
    searchPlacementsRecursive(shapeIndexes, 0, occupied, [], [], solutions, limit, permanentLine, anchor + 1, [...permanentCells], shapeIndexes);
  }

  const sorted = [...solutions].sort((a, b) => {
    if (a.placed !== b.placed) return b.placed - a.placed;
    if (a.flex !== b.flex) return b.flex - a.flex;
    if (a.skipped !== b.skipped) return a.skipped - b.skipped;
    return a.line.localeCompare(b.line, "zh-CN");
  });

  const diagnostics =
    shapes.length === 0
      ? "还没有输入任何拼图形状。"
      : `输入 ${shapes.map((shape) => SHAPE_LABELS[shape]).join("、")} · 永久 O 尝试 ${permanentAttempts} 个位置 · 输出前 ${Math.min(limit, sorted.length)} 条方案`;

  return {
    solutions: sorted.slice(0, limit),
    diagnostics,
  };
}
