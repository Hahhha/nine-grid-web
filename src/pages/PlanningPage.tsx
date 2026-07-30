import { useMemo, useState } from "react";
import { STORAGE_KEYS } from "../app/storageKeys";
import { PageCard } from "../components/common/PageCard";
import { CandidateEditor } from "../components/planning/CandidateEditor";
import { CandidateList } from "../components/planning/CandidateList";
import { GoalEditor } from "../components/planning/GoalEditor";
import { PlanningResultPanel } from "../components/planning/PlanningResultPanel";
import { APP_SAVED_ROUTE_CANDIDATES, APP_SAVED_ROUTE_GOAL } from "../data/appSavedPlanningSeed";
import { enumeratePlanningCombos } from "../core/planning/planningEnumerate";
import { filterPlanningCandidates } from "../core/planning/planningFilter";
import { runPlanning } from "../core/planning/planningScore";
import { PLANNING_MAX_FILTERED_CANDIDATES } from "../core/planning/planningRules";
import { useLocalState } from "../hooks/useLocalState";
import type { PuzzlePiece } from "../types/domain";
import type { PlanningGoal, PlanningResult } from "../types/planning";

const DEFAULT_GOAL: PlanningGoal = {
  element: "fire",
  counts: {
    subStats: {
      crit: 0,
      tune: 0,
      mastery: 0,
      guard: 0,
    },
    elementSkills: {},
    sameElementBoost: 0,
  },
};

const DEFAULT_PIECE: PuzzlePiece = {
  id: "draft-piece",
  shape: "O",
  rarity: "blue",
  element: "fire",
  subStat: "crit",
  greenSkill: "天火陨星",
  blueStat: "sameElementBoost",
  purpleSkill: "烈火燎原",
};

export function PlanningPage() {
  const [savedGoal, setSavedGoal] = useLocalState<PlanningGoal>(STORAGE_KEYS.routeGoal, DEFAULT_GOAL);
  const [draftGoal, setDraftGoal] = useLocalState<PlanningGoal>(STORAGE_KEYS.routeGoalDraft, savedGoal);
  const [candidates, setCandidates] = useLocalState<PuzzlePiece[]>(STORAGE_KEYS.routeCandidates, []);
  const [draftPiece, setDraftPiece] = useLocalState<PuzzlePiece>(STORAGE_KEYS.routeDraftPiece, DEFAULT_PIECE);
  const [results, setResults] = useLocalState<PlanningResult[]>(STORAGE_KEYS.routeResults, []);
  const [activeResultId, setActiveResultId] = useLocalState<string>(STORAGE_KEYS.routeActiveResultId, "");

  const goalSummary = useMemo(() => {
    const skillTargets = Object.entries(savedGoal.counts.elementSkills)
      .filter(([, count]) => (count ?? 0) > 0)
      .map(([skill, count]) => `${skill}×${count}`);
    return [
      `元素：${savedGoal.element}`,
      `同元素增强：${savedGoal.counts.sameElementBoost}`,
      ...skillTargets,
    ];
  }, [savedGoal]);

  const addCandidate = () => {
    const newPiece = {
      ...draftPiece,
      id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    };
    setCandidates([...candidates, newPiece]);
  };

  const filteredPreview = useMemo(() => filterPlanningCandidates(candidates, savedGoal), [candidates, savedGoal]);

  const filterNotes = useMemo(() => {
    return [
      `同元素过滤掉 ${filteredPreview.excludedByElement} 个`,
      `非蓝/紫过滤掉 ${filteredPreview.excludedByRarity} 个`,
      `对目标贡献为 0 过滤掉 ${filteredPreview.excludedByGoalScore} 个`,
    ];
  }, [filteredPreview]);

  const importAppSavedRouteData = () => {
    setSavedGoal(APP_SAVED_ROUTE_GOAL);
    setDraftGoal(APP_SAVED_ROUTE_GOAL);
    setCandidates(APP_SAVED_ROUTE_CANDIDATES);
    setResults([]);
    setActiveResultId("");
  };

  const planRoutes = () => {
    if (filteredPreview.filteredCount > PLANNING_MAX_FILTERED_CANDIDATES) {
      const overCap: PlanningResult = {
        id: "over-cap",
        title: "候选过多，未进入全量组合",
        summary: `预排除后仍有 ${filteredPreview.filteredCount} 个候选；全量模式上限为 ${PLANNING_MAX_FILTERED_CANDIDATES}。`,
        diagnostics: `原始候选 ${filteredPreview.rawCount} 个 · 同元素过滤 ${filteredPreview.excludedByElement} 个 · 非蓝/紫过滤 ${filteredPreview.excludedByRarity} 个 · 贡献为 0 过滤 ${filteredPreview.excludedByGoalScore} 个`,
        usingPieces: ["请先减少候选，或继续收紧目标后再规划。"],
        missingShapes: ["暂未进入计算"],
        missingAttributes: ["暂未进入计算"],
        suggestedPieces: ["优先保留高贡献候选，删除贡献为 0 的拼图"],
        replacementAdvice: ["先压缩候选集，再运行全量模式"],
        stats: {
          rawCandidates: filteredPreview.rawCount,
          filteredCandidates: filteredPreview.filteredCount,
          enumerated9: 0,
          enumerated8: 0,
          enumerated7: 0,
          enumerated6: 0,
          enumerated5: 0,
        },
      };
      setResults([overCap]);
      setActiveResultId(overCap.id);
      return;
    }

    const { combos, stats } = enumeratePlanningCombos(filteredPreview.filtered);
    const plannedResults = runPlanning(savedGoal, combos, filteredPreview.filtered, filteredPreview, stats);
    setResults(plannedResults);
    setActiveResultId(plannedResults[0]?.id ?? "");
  };

  return (
    <div className="section-stack">
      <div className="page-intro">这一页会优先使用你的候选集，再按目标属性和合法形状配比推荐 9 / 8 / 7 / 6 / 5 候选路线。默认已包含 1 个永久 O 田字格；它不计入候选数量，所以候选最多仍是 9 块。</div>

      <div className="page-grid wide-right">
        <PageCard title="目标总体属性" note="先编辑，再单独保存为当前规划目标">
          <div className="section-stack">
            <GoalEditor goal={draftGoal} onChange={setDraftGoal} />
            <div className="helper-row">
              <button type="button" className="button primary" onClick={() => setSavedGoal(draftGoal)}>
                保存目标
              </button>
              <button type="button" className="button secondary" onClick={importAppSavedRouteData}>
                导入 App 已保存数据
              </button>
              <span className="helper-text">只有保存后的目标才会参与规划。</span>
            </div>
            <div className="summary-box">
              <p className="mini-note">已保存目标摘要</p>
              <div className="pill-row" style={{ marginTop: 10 }}>
                {goalSummary.map((item) => (
                  <span key={item} className="pill">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </PageCard>

        <PageCard title="加入候选拼图" note="下一步再补批量导入和预排除统计">
          <div className="section-stack">
            <CandidateEditor piece={draftPiece} onChange={setDraftPiece} onAdd={addCandidate} />
              <span className="helper-text">当前规划只接受蓝色 / 紫色候选，并会自动过滤掉与目标元素不一致或对目标无贡献的拼图。永久 O 已默认计入合法配比，不占这里的候选名额。</span>
          </div>
        </PageCard>
      </div>

      <div className="page-grid wide-right">
        <PageCard title="候选集合" note={`当前 ${candidates.length} 个`}>
          <div className="section-stack">
            <div className="summary-box">
              <p className="mini-note">
                原始候选 {filteredPreview.rawCount} 个 · 预排除后 {filteredPreview.filteredCount} 个 · 全量模式上限 {PLANNING_MAX_FILTERED_CANDIDATES} 个
              </p>
              <div className="pill-row" style={{ marginTop: 10 }}>
                {filterNotes.map((item) => (
                  <span key={item} className="pill">
                    {item}
                  </span>
                ))}
              </div>
            </div>
            <CandidateList
              pieces={candidates}
              onRemove={(id) => setCandidates(candidates.filter((piece) => piece.id !== id))}
              onClear={() => setCandidates([])}
            />
          </div>
        </PageCard>

        <PageCard title="推荐合成解法" note="当前已接入候选预过滤和 9 / 8 / 7 / 6 / 5 全量组合">
          <div className="section-stack">
            <div className="helper-row">
              <button type="button" className="button primary" onClick={planRoutes} disabled={candidates.length === 0}>
                规划路线
              </button>
              <span className="helper-text">
                {candidates.length === 0 ? "先加入至少 1 个候选拼图。" : "会优先收集 9 候选方案，不足 5 个再补 8 / 7 / 6 / 5 候选方案；永久 O 已默认算入棋盘，不占候选位。"}
              </span>
            </div>
            <PlanningResultPanel results={results} activeId={activeResultId} onSelect={setActiveResultId} />
          </div>
        </PageCard>
      </div>
    </div>
  );
}
