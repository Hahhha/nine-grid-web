import { BLUE_STAT_LABELS, RARITY_LABELS, SHAPE_LABELS, SUBSTAT_LABELS } from "../../data/options";
import type { BlueStat, PuzzlePiece, Shape } from "../../types/domain";

export const SHAPE_ORDER: Shape[] = ["O", "I", "T", "L", "J"];

export function formatBlueStatName(blueStat?: BlueStat, elementLabel?: string): string | null {
  if (!blueStat) return null;
  if (blueStat === "sameElementBoost") return `${elementLabel ?? "同元素"}增强`;
  return "任意抵抗";
}

export function pieceSummary(piece: PuzzlePiece, elementLabel?: string): string {
  const parts = [
    SHAPE_LABELS[piece.shape],
    RARITY_LABELS[piece.rarity],
    `白:${piece.subStat ? SUBSTAT_LABELS[piece.subStat] : "空"}`,
  ];

  if (piece.greenSkill) parts.push(`绿:${piece.greenSkill}`);
  const blueName = formatBlueStatName(piece.blueStat, elementLabel);
  if (blueName) parts.push(`蓝:${blueName}`);
  if (piece.purpleSkill) parts.push(`紫:${piece.purpleSkill}`);
  return parts.join(" · ");
}

export function shapeCountsForPieces(pieces: PuzzlePiece[]): Record<Shape, number> {
  const counts: Record<Shape, number> = { O: 0, I: 0, T: 0, L: 0, J: 0 };
  pieces.forEach((piece) => {
    counts[piece.shape] += 1;
  });
  return counts;
}
