import type { BlueStat, Element, ElementSkill, Rarity, Shape, SubStat } from "./domain";

export type SynthesisStartRarity = "white" | "green" | "blue";

export type SynthesisDraft = {
  targetShape: Shape;
  targetRarity: Rarity;
  targetElement: Element;
  subStat?: SubStat;
  greenSkill?: ElementSkill;
  blueStat?: BlueStat;
  purpleSkill?: ElementSkill;
  startRarity: SynthesisStartRarity;
};
