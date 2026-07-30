import type { Element, ElementSkill } from "../types/domain";

export const ELEMENT_LABELS: Record<Element, string> = {
  fire: "火",
  ice: "冰",
  thunder: "雷",
  wood: "木",
};

export const ELEMENT_SKILLS: Record<Element, ElementSkill[]> = {
  fire: ["天火陨星", "烈火燎原", "赤焰天环", "烈焰焚身", "神火迸发"],
  ice: ["凛霜寒涌", "寒潮冰涌", "寒晶刺", "霜刺寒雨", "霜寒破裂"],
  thunder: ["惊雷戟", "五雷珠", "雷霆震击", "天雷护佑", "九霄雷动"],
  wood: ["腐木瘴风", "神木骰（天工）", "苍林浮生", "木引青灵", "裂地崩"],
};
