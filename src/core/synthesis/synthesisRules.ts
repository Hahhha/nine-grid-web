import type { SynthesisDraft } from "../../types/synthesis";

export type SynthesisTargetTier = 1 | 2 | 3;

export function getTargetTier(draft: SynthesisDraft): SynthesisTargetTier {
  if (draft.targetRarity === "green") return 1;
  if (draft.targetRarity === "blue") return 2;
  return 3;
}

export function synthesisPurpleAffixesSwappable(draft: SynthesisDraft): boolean {
  if (draft.targetRarity !== "purple") return false;
  return Boolean(draft.greenSkill && draft.purpleSkill && draft.greenSkill !== draft.purpleSkill);
}

export function chainProbabilityForDraft(draft: SynthesisDraft): number {
  const tier = getTargetTier(draft);
  if (tier === 1) return 1 / 20;
  if (tier === 2) return 1 / 100;
  return synthesisPurpleAffixesSwappable(draft) ? 1 / 250 : 1 / 500;
}
