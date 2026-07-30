import { useMemo } from "react";
import { PageCard } from "../components/common/PageCard";
import { PieceSummary } from "../components/synthesis/PieceSummary";
import { SynthesisForm } from "../components/synthesis/SynthesisForm";
import { SynthesisResult } from "../components/synthesis/SynthesisResult";
import { STORAGE_KEYS } from "../app/storageKeys";
import { formatSynthesisResult, formatSynthesisSummary } from "../core/synthesis/synthesisFormat";
import { useLocalState } from "../hooks/useLocalState";
import type { SynthesisDraft } from "../types/synthesis";

const DEFAULT_SYNTHESIS_DRAFT: SynthesisDraft = {
  targetShape: "T",
  targetRarity: "purple",
  targetElement: "fire",
  subStat: "crit",
  greenSkill: "天火陨星",
  blueStat: "sameElementBoost",
  purpleSkill: "烈火燎原",
  startRarity: "white",
};

export function SynthesisPage() {
  const [draft, setDraft] = useLocalState<SynthesisDraft>(STORAGE_KEYS.synthesisDraft, DEFAULT_SYNTHESIS_DRAFT);

  const summaryLines = useMemo(() => formatSynthesisSummary(draft), [draft]);
  const resultLines = useMemo(() => formatSynthesisResult(draft), [draft]);

  return (
    <div className="section-stack">
      <div className="page-intro">这一页专门算单个目标拼图的合成概率、单次材料和期望材料。现在口径已经对齐到当前网页版规则。</div>

      <div className="page-grid two-column">
        <PageCard title="目标拼图的合成" note="切换词条后，右侧结果会自动更新">
          <div className="section-stack">
            <SynthesisForm draft={draft} onChange={setDraft} />
            <PieceSummary lines={summaryLines} />
          </div>
        </PageCard>

        <PageCard title="合成计算结果" note="按当前选择实时计算">
          <SynthesisResult lines={resultLines} />
        </PageCard>
      </div>
    </div>
  );
}
