import type { Shape } from "../../types/domain";

export const BOARD_CELL_COUNT = 40;
export const SHAPE_TO_INDEX: Record<Shape, number> = {
  O: 0,
  I: 1,
  T: 2,
  L: 3,
  J: 4,
};

export const INDEX_TO_SHAPE: Shape[] = ["O", "I", "T", "L", "J"];

export function gridPointForCell(cellID: number): { x: number; y: number } | null {
  if (cellID < 4) return { x: cellID + 1, y: 6 };
  if (cellID < 40) {
    const index = cellID - 4;
    return { x: index % 6, y: 5 - Math.floor(index / 6) };
  }
  return null;
}

export function cellForColRow(col: number, row: number): number {
  if (row === 6 && col >= 1 && col <= 4) return col - 1;
  if (row >= 0 && row <= 5 && col >= 0 && col <= 5) return 4 + (5 - row) * 6 + col;
  return -1;
}

export function offsetsForShape(shapeIndex: number, rotation: number): Array<[number, number]> {
  const r = rotation % 4;
  if (shapeIndex === 0) {
    return [
      [0, 0],
      [1, 0],
      [0, 1],
      [1, 1],
    ];
  }
  if (shapeIndex === 1) {
    if (r % 2 === 0) {
      return [
        [0, 0],
        [1, 0],
        [2, 0],
        [3, 0],
      ];
    }
    return [
      [0, 0],
      [0, 1],
      [0, 2],
      [0, 3],
    ];
  }

  let base: Array<[number, number]>;
  if (shapeIndex === 2) {
    base = [
      [0, 0],
      [1, 0],
      [2, 0],
      [1, 1],
    ];
  } else if (shapeIndex === 3) {
    base = [
      [0, 0],
      [0, 1],
      [0, 2],
      [1, 0],
    ];
  } else {
    base = [
      [1, 0],
      [1, 1],
      [1, 2],
      [0, 0],
    ];
  }

  const rotated = base.map(([x, y]) => {
    if (r === 1) return [y, -x] as [number, number];
    if (r === 2) return [-x, -y] as [number, number];
    if (r === 3) return [-y, x] as [number, number];
    return [x, y] as [number, number];
  });

  const minX = Math.min(...rotated.map(([x]) => x));
  const minY = Math.min(...rotated.map(([, y]) => y));
  return rotated.map(([x, y]) => [x - minX, y - minY]);
}

export function occupiedCellsForShape(shapeIndex: number, rotation: number, anchor: number): number[] | null {
  const anchorPoint = gridPointForCell(anchor);
  if (!anchorPoint) return null;
  const offsets = offsetsForShape(shapeIndex, rotation);
  const cells: number[] = [];
  for (const [dx, dy] of offsets) {
    const col = anchorPoint.x + dx;
    const row = anchorPoint.y + dy;
    const cell = cellForColRow(col, row);
    if (cell < 0) return null;
    cells.push(cell);
  }
  return cells;
}

const placementCache = new Map<number, number[][]>();

export function allPlacementsForShape(shapeIndex: number): number[][] {
  if (placementCache.has(shapeIndex)) return placementCache.get(shapeIndex)!;
  const placements: number[][] = [];
  const seen = new Set<string>();
  for (let anchor = 0; anchor < BOARD_CELL_COUNT; anchor += 1) {
    for (let rotation = 0; rotation < 4; rotation += 1) {
      const cells = occupiedCellsForShape(shapeIndex, rotation, anchor);
      if (!cells) continue;
      const sorted = [...cells].sort((a, b) => a - b);
      const key = sorted.join(",");
      if (seen.has(key)) continue;
      seen.add(key);
      placements.push(sorted);
    }
  }
  placementCache.set(shapeIndex, placements);
  return placements;
}

export function cellsAreFree(cells: number[] | null, occupied: Set<number>): boolean {
  if (!cells) return false;
  for (const cell of cells) {
    if (occupied.has(cell)) return false;
  }
  return true;
}

export function remainingPlaceableShapeTypes(occupied: Set<number>, candidateShapeIndexes: number[]): number {
  let count = 0;
  const unique = [...new Set(candidateShapeIndexes)];
  unique.forEach((shapeIndex) => {
    let canPlace = false;
    for (let anchor = 0; anchor < BOARD_CELL_COUNT && !canPlace; anchor += 1) {
      for (let rotation = 0; rotation < 4 && !canPlace; rotation += 1) {
        const cells = occupiedCellsForShape(shapeIndex, rotation, anchor);
        canPlace = cellsAreFree(cells, occupied);
      }
    }
    if (canPlace) count += 1;
  });
  return count;
}

export function freeCellCount(occupied: Set<number>): number {
  let count = 0;
  for (let cell = 0; cell < BOARD_CELL_COUNT; cell += 1) {
    if (!occupied.has(cell)) count += 1;
  }
  return count;
}
