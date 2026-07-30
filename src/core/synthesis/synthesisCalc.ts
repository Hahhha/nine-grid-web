import type { SynthesisDraft } from "../../types/synthesis";
import { chainProbabilityForDraft, getTargetTier, synthesisPurpleAffixesSwappable } from "./synthesisRules";

export type MaterialRoute = {
  name: string;
  singleAttempt: string;
  expected: string;
};

export type SynthesisCalculation = {
  probability: number;
  tier: 1 | 2 | 3;
  swappable: boolean;
  materials: MaterialRoute[];
  poolNote: string;
};

export function calculateSynthesis(draft: SynthesisDraft): SynthesisCalculation {
  const tier = getTargetTier(draft);
  const swappable = synthesisPurpleAffixesSwappable(draft);

  if (tier === 1) {
    return {
      probability: chainProbabilityForDraft(draft),
      tier,
      swappable,
      materials: [
        {
          name: "从白胚起步",
          singleAttempt: "白胚 1 + 白狗粮 4",
          expected: "白胚 20 + 白狗粮 80",
        },
      ],
      poolNote: "白升绿：20 条元素词条等概率。",
    };
  }

  if (tier === 2) {
    return {
      probability: chainProbabilityForDraft(draft),
      tier,
      swappable,
      materials: [
        {
          name: "已有绿胚",
          singleAttempt: "绿胚 1 + 绿狗粮 4",
          expected: "绿胚 5 + 绿狗粮 20",
        },
        {
          name: "从白胚起步",
          singleAttempt: "白胚 1 + 白狗粮 4 + 绿狗粮 4",
          expected: "白胚 100 + 白狗粮 400 + 绿狗粮 20",
        },
      ],
      poolNote: "白升绿 1/20；绿升蓝 5 种合法蓝词条等概率。",
    };
  }

  return {
    probability: chainProbabilityForDraft(draft),
    tier,
    swappable,
    materials: swappable
      ? [
          {
            name: "已有蓝胚",
            singleAttempt: "蓝胚 1 + 蓝狗粮 4",
            expected: "蓝胚 2.5 + 蓝狗粮 10",
          },
          {
            name: "从绿胚起步",
            singleAttempt: "绿胚 1 + 绿狗粮 4 + 蓝狗粮 4",
            expected: "绿胚 12.5 + 绿狗粮 50 + 蓝狗粮 10",
          },
          {
            name: "从白胚起步",
            singleAttempt: "白胚 1 + 白狗粮 4 + 绿狗粮 4 + 蓝狗粮 4",
            expected: "白胚 250 + 白狗粮 1000 + 绿狗粮 50 + 蓝狗粮 10",
          },
        ]
      : [
          {
            name: "已有蓝胚",
            singleAttempt: "蓝胚 1 + 蓝狗粮 4",
            expected: "蓝胚 5 + 蓝狗粮 20",
          },
          {
            name: "从绿胚起步",
            singleAttempt: "绿胚 1 + 绿狗粮 4 + 蓝狗粮 4",
            expected: "绿胚 25 + 绿狗粮 100 + 蓝狗粮 20",
          },
          {
            name: "从白胚起步",
            singleAttempt: "白胚 1 + 白狗粮 4 + 绿狗粮 4 + 蓝狗粮 4",
            expected: "白胚 500 + 白狗粮 2000 + 绿狗粮 100 + 蓝狗粮 20",
          },
        ],
    poolNote: swappable
      ? "白升绿 1/20；绿升蓝 1/5；蓝升紫 5 词条等概率；紫色目标下绿/紫词条互换同样算命中。"
      : "白升绿 1/20；绿升蓝 1/5；蓝升紫同元素 5 词条等概率。",
  };
}
