import { BLUE_STAT_LABELS, RARITY_LABELS, SHAPE_LABELS, SUBSTAT_LABELS } from "../../data/options";
import type { SynthesisDraft } from "../../types/synthesis";
import { calculateSynthesis } from "./synthesisCalc";
import { synthesisPurpleAffixesSwappable } from "./synthesisRules";

export function formatSynthesisSummary(draft: SynthesisDraft): string[] {
  const parts = [
    `形状：${SHAPE_LABELS[draft.targetShape]}`,
    `等级：${RARITY_LABELS[draft.targetRarity]}`,
    `白色词条：${draft.subStat ? SUBSTAT_LABELS[draft.subStat] : "空"}`,
    `绿色词条：${draft.greenSkill ?? "空"}`,
  ];

  if (draft.targetRarity === "blue" || draft.targetRarity === "purple") {
    parts.push(`蓝色词条：${draft.blueStat ? BLUE_STAT_LABELS[draft.blueStat] : "空"}`);
  }

  if (draft.targetRarity === "purple") {
    parts.push(`紫色词条：${draft.purpleSkill ?? "空"}`);
  }

  if (synthesisPurpleAffixesSwappable(draft)) {
    parts.push(`紫色命中可接受：绿 ${draft.greenSkill} / 紫 ${draft.purpleSkill} 互换`);
  }

  return parts;
}

export function formatSynthesisResult(draft: SynthesisDraft): string[] {
  const calc = calculateSynthesis(draft);
  const probabilityPercent = `${(calc.probability * 100).toFixed(calc.probability * 100 < 1 ? 2 : 1)}%`;
  const title = calc.tier === 1 ? "绿色" : calc.tier === 2 ? "蓝色" : "紫色";
  const lines: string[] = [`目标等级命中概率：${title} · ${probabilityPercent}`];

  lines.push("");
  lines.push("单次材料：");
  calc.materials.forEach((route, index) => {
    lines.push(`${index + 1}. ${route.name}：${route.singleAttempt}`);
  });

  lines.push("");
  lines.push("期望材料（做成 1 个）：");
  calc.materials.forEach((route, index) => {
    lines.push(`${index + 1}. ${route.name}：${route.expected}`);
  });

  lines.push("");
  lines.push(`随机池说明：${calc.poolNote}`);

  if (calc.swappable) {
    lines.push("补充说明：当前按“绿词条 / 紫词条互换也算命中”计算，所以紫色路线命中率更高。");
  }

  return lines;
}
