import type { BlueStat, Rarity, Shape, SubStat } from "../types/domain";

export const SHAPE_LABELS: Record<Shape, string> = {
  O: "O 田字格",
  I: "I 长条",
  T: "T 丁字格",
  L: "L 形",
  J: "J 对称 L",
};

export const RARITY_LABELS: Record<Rarity, string> = {
  white: "白色",
  green: "绿色",
  blue: "蓝色",
  purple: "紫色",
};

export const SUBSTAT_LABELS: Record<SubStat, string> = {
  crit: "会心",
  tune: "调息",
  mastery: "专精",
  guard: "元御",
};

export const BLUE_STAT_LABELS: Record<BlueStat, string> = {
  sameElementBoost: "同元素增强",
  anyResistance: "任意抵抗",
};
