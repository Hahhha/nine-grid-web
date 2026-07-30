export type Shape = "O" | "I" | "T" | "L" | "J";
export type Rarity = "white" | "green" | "blue" | "purple";
export type Element = "fire" | "ice" | "thunder" | "wood";
export type SubStat = "crit" | "tune" | "mastery" | "guard";
export type BlueStat = "sameElementBoost" | "anyResistance";

export type ElementSkill =
  | "天火陨星"
  | "烈火燎原"
  | "赤焰天环"
  | "烈焰焚身"
  | "神火迸发"
  | "凛霜寒涌"
  | "寒潮冰涌"
  | "寒晶刺"
  | "霜刺寒雨"
  | "霜寒破裂"
  | "惊雷戟"
  | "五雷珠"
  | "雷霆震击"
  | "天雷护佑"
  | "九霄雷动"
  | "腐木瘴风"
  | "神木骰（天工）"
  | "苍林浮生"
  | "木引青灵"
  | "裂地崩";

export type PuzzlePiece = {
  id: string;
  shape: Shape;
  rarity: Rarity;
  element: Element;
  subStat?: SubStat;
  greenSkill?: ElementSkill;
  blueStat?: BlueStat;
  purpleSkill?: ElementSkill;
};
