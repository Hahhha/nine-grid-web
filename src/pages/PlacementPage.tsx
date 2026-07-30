import { useMemo } from "react";
import { STORAGE_KEYS } from "../app/storageKeys";
import { PageCard } from "../components/common/PageCard";
import { PlacementBoard } from "../components/placement/PlacementBoard";
import { SHAPE_LABELS } from "../data/options";
import { searchPlacementSolutions } from "../core/placement/search";
import { useLocalState } from "../hooks/useLocalState";
import type { Shape } from "../types/domain";
import type { PlacementShapeItem } from "../types/placement";

export function PlacementPage() {
  const [draftShape, setDraftShape] = useLocalState<Shape>(STORAGE_KEYS.placementDraftShape, "O");
  const [items, setItems] = useLocalState<PlacementShapeItem[]>(STORAGE_KEYS.placementShapes, []);
  const [hasSearched, setHasSearched] = useLocalState<boolean>(STORAGE_KEYS.placementHasSearched, false);

  const result = useMemo(() => searchPlacementSolutions(items.map((item) => item.shape), 5), [items]);

  return (
    <div className="section-stack">
      <div className="page-intro">这一页按形状搜索摆法，默认带 1 个永久 O 格。当前优先返回“摆得更多、剩余可容纳更多、跳过更少”的方案。</div>

      <div className="page-grid wide-right">
        <PageCard title="摆放推荐" note="先按形状搜索 1-5 种方案，自动带上永久 O 格">
          <div className="section-stack">
            <div className="field-grid tight">
              <label className="field-label">形状</label>
              <select className="select" value={draftShape} onChange={(event) => setDraftShape(event.target.value as Shape)}>
                {Object.entries(SHAPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div className="helper-row">
              <button
                type="button"
                className="button primary"
                onClick={() =>
                  setItems([
                    ...items,
                    {
                      id: `${Date.now()}-${Math.random().toString(16).slice(2, 7)}`,
                      shape: draftShape,
                    },
                  ])
                }
              >
                Add 形状
              </button>
              <button
                type="button"
                className="button secondary"
                onClick={() => {
                  setItems([]);
                  setHasSearched(false);
                }}
              >
                清空
              </button>
              <button type="button" className="button primary" onClick={() => setHasSearched(true)} disabled={items.length === 0}>
                搜索摆法
              </button>
            </div>

            <div className="summary-box">
              <p className="mini-note">当前输入</p>
              <div className="pill-row" style={{ marginTop: 10 }}>
                {items.length === 0 ? (
                  <span className="pill">暂无输入</span>
                ) : (
                  items.map((item, index) => (
                    <span key={item.id} className="pill">
                      {index + 1}. {SHAPE_LABELS[item.shape]}
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>
        </PageCard>

        <PageCard title="推荐结果" note="目标是尽量多摆，并保证剩余区域还能容纳输入形状中的至少一种">
          <div className="section-stack">
          <div className="stats-strip">
            <span>{result.diagnostics}</span>
          </div>

          {!hasSearched ? (
            <div className="placeholder-box">
              <p className="muted">先加入几个形状，再点“搜索摆法”。</p>
            </div>
          ) : result.solutions.length === 0 ? (
            <div className="placeholder-box">
              <p className="muted">当前这组形状没有找到符合条件的推荐结果。</p>
            </div>
          ) : (
            <div className="section-stack">
              {result.solutions.map((solution, index) => (
                <div key={solution.id} className="result-section">
                  <h4 className="result-section-title">方案 {index + 1}</h4>
                  <div className="result-section-body">
                    <PlacementBoard solution={solution} />

                    <div className="stats-grid" style={{ marginBottom: 14, gridTemplateColumns: "repeat(4, minmax(0, 1fr))" }}>
                      <div className="stats-card">
                        <strong>永久 O</strong>
                        <span style={{ fontSize: 18 }}>{solution.permanentAnchor}</span>
                      </div>
                      <div className="stats-card">
                        <strong>已摆块数</strong>
                        <span style={{ fontSize: 18 }}>{solution.placed}</span>
                      </div>
                      <div className="stats-card">
                        <strong>跳过块数</strong>
                        <span style={{ fontSize: 18 }}>{solution.skipped}</span>
                      </div>
                      <div className="stats-card">
                        <strong>剩余可容纳</strong>
                        <span style={{ fontSize: 18 }}>{solution.flex}</span>
                      </div>
                    </div>

                    <div className="section-stack" style={{ gap: 12 }}>
                      <p>{solution.line}</p>
                      <div className="result-section">
                        <h4 className="result-section-title">摆放步骤</h4>
                        <div className="result-section-body">
                          {solution.steps.length === 0 ? (
                            <p className="muted">没有成功摆入普通拼图。</p>
                          ) : (
                            <ol className="result-list">
                              {solution.steps.map((step, stepIndex) => (
                                <li key={`${solution.id}-${stepIndex}`}>{step}</li>
                              ))}
                            </ol>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        </PageCard>
      </div>
    </div>
  );
}
