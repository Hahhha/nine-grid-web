import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

const SHAPES = ["O", "I", "T", "L", "J"];
const SLOT_COUNT = 9;
const BOARD_CELL_COUNT = 40;

function gridPointForCell(cellID) {
  if (cellID < 4) return { x: cellID + 1, y: 6 };
  if (cellID < 40) {
    const index = cellID - 4;
    return { x: index % 6, y: 5 - Math.floor(index / 6) };
  }
  return null;
}

function cellForColRow(col, row) {
  if (row === 6 && col >= 1 && col <= 4) return col - 1;
  if (row >= 0 && row <= 5 && col >= 0 && col <= 5) return 4 + (5 - row) * 6 + col;
  return -1;
}

function offsetsForShape(shape, rotation) {
  const r = rotation % 4;
  if (shape === 0) {
    return [
      [0, 0],
      [1, 0],
      [0, 1],
      [1, 1],
    ];
  }
  if (shape === 1) {
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

  let base;
  if (shape === 2) {
    base = [
      [0, 0],
      [1, 0],
      [2, 0],
      [1, 1],
    ];
  } else if (shape === 3) {
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
    if (r === 1) return [y, -x];
    if (r === 2) return [-x, -y];
    if (r === 3) return [-y, x];
    return [x, y];
  });

  const minX = Math.min(...rotated.map(([x]) => x));
  const minY = Math.min(...rotated.map(([, y]) => y));
  return rotated.map(([x, y]) => [x - minX, y - minY]);
}

function occupiedCellsForShape(shape, rotation, anchor) {
  const anchorPoint = gridPointForCell(anchor);
  if (!anchorPoint) return null;
  const offsets = offsetsForShape(shape, rotation);
  const cells = [];
  for (const [dx, dy] of offsets) {
    const col = anchorPoint.x + dx;
    const row = anchorPoint.y + dy;
    const cell = cellForColRow(col, row);
    if (cell < 0) return null;
    cells.push(cell);
  }
  return cells;
}

const placementCache = new Map();

function allPlacementsForShape(shape) {
  if (placementCache.has(shape)) return placementCache.get(shape);
  const placements = [];
  const seen = new Set();
  for (let anchor = 0; anchor < BOARD_CELL_COUNT; anchor += 1) {
    for (let rotation = 0; rotation < 4; rotation += 1) {
      const cells = occupiedCellsForShape(shape, rotation, anchor);
      if (!cells) continue;
      const sorted = [...cells].sort((a, b) => a - b);
      const key = sorted.join(",");
      if (seen.has(key)) continue;
      seen.add(key);
      placements.push(sorted);
    }
  }
  placementCache.set(shape, placements);
  return placements;
}

const placementsByCellByShape = Array.from({ length: 5 }, (_, shape) => {
  const buckets = Array.from({ length: BOARD_CELL_COUNT }, () => []);
  for (const placement of allPlacementsForShape(shape)) {
    for (const cell of placement) buckets[cell].push(placement);
  }
  return buckets;
});

function exactCanFillBoardWithCounts(shapeCountsWithoutPermanentO) {
  const counts = [1, ...shapeCountsWithoutPermanentO.slice(1)];
  counts[0] = shapeCountsWithoutPermanentO[0] + 1;
  const occupied = new Set();
  let budget = 65000;
  return exactFillOccupied(occupied, counts, budget);
}

function exactFillOccupied(occupied, counts, budget) {
  if (budget <= 0) return false;
  budget -= 1;
  if (occupied.size === BOARD_CELL_COUNT) {
    return counts.every((count) => count === 0);
  }

  let bestOptions = null;
  for (let cell = 0; cell < BOARD_CELL_COUNT; cell += 1) {
    if (occupied.has(cell)) continue;
    const options = [];
    for (let shape = 0; shape < 5; shape += 1) {
      if (counts[shape] <= 0) continue;
      for (const placement of placementsByCellByShape[shape][cell]) {
        let free = true;
        for (const p of placement) {
          if (occupied.has(p)) {
            free = false;
            break;
          }
        }
        if (free) options.push({ shape, placement });
      }
    }
    if (!bestOptions || options.length < bestOptions.length) {
      bestOptions = options;
      if (options.length === 0) return false;
    }
  }

  for (const option of bestOptions) {
    counts[option.shape] -= 1;
    for (const cell of option.placement) occupied.add(cell);
    if (exactFillOccupied(occupied, counts, budget)) return true;
    for (const cell of option.placement) occupied.delete(cell);
    counts[option.shape] += 1;
  }
  return false;
}

const allDistributions = [];
const legalDistributions = [];

for (let o = 0; o <= SLOT_COUNT; o += 1) {
  for (let i = 0; i <= SLOT_COUNT - o; i += 1) {
    for (let t = 0; t <= SLOT_COUNT - o - i; t += 1) {
      for (let l = 0; l <= SLOT_COUNT - o - i - t; l += 1) {
        const j = SLOT_COUNT - o - i - t - l;
        const counts = [o, i, t, l, j];
        allDistributions.push(counts);
        if (exactCanFillBoardWithCounts(counts)) {
          legalDistributions.push({
            O: o,
            I: i,
            T: t,
            L: l,
            J: j,
          });
        }
      }
    }
  }
}

const outPath = resolve(process.cwd(), "src/data/legalShapeTargets.generated.json");
writeFileSync(outPath, `${JSON.stringify(legalDistributions, null, 2)}\n`, "utf8");

console.log(
  JSON.stringify(
    {
      totalDistributions: allDistributions.length,
      legalDistributions: legalDistributions.length,
      outPath,
    },
    null,
    2,
  ),
);
