import type { PlanningResult } from "../../types/planning";

type Props = {
  results: PlanningResult[];
  activeId: string;
  onSelect: (id: string) => void;
};

export function PlanningResultPanel({ results, activeId, onSelect }: Props) {
  const activeResult = results.find((result) => result.id === activeId) ?? results[0];

  const renderList = (title: string, items: string[]) => (
    <section className="result-section">
      <h4 className="result-section-title">{title}</h4>
      <div className="result-section-body">
        {items.length === 0 ? (
          <p className="muted">无</p>
        ) : (
          <ul className="result-list">
            {items.map((item, index) => (
              <li key={`${title}-${index}`}>{item}</li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );

  if (!activeResult) {
    return (
      <div className="placeholder-box">
        <p className="muted">先点一次“规划路线”，这里就会显示当前候选集的推荐结果。</p>
      </div>
    );
  }

  return (
    <div>
      <div className="result-tabs">
        {results.map((result) => (
          <button
            key={result.id}
            type="button"
            className={result.id === activeResult.id ? "result-tab active" : "result-tab"}
            onClick={() => onSelect(result.id)}
          >
            {result.title}
          </button>
        ))}
      </div>

      <div className="result-box section-stack">
        <div className="result-header">
          <h3>{activeResult.title}</h3>
          <p>{activeResult.summary}</p>
        </div>

        <div className="stats-strip">
          <span>说明：当前规划结果默认已按“额外 1 个永久 O 田字格”预计算合法配比；这个永久 O 不计入候选数量。</span>
        </div>

        {activeResult.diagnostics ? (
          <div className="stats-strip">
            <span>{activeResult.diagnostics}</span>
          </div>
        ) : null}

        <div className="stats-grid">
          <div className="stats-card">
            <strong>原始候选</strong>
            <span>{activeResult.stats.rawCandidates}</span>
          </div>
          <div className="stats-card">
            <strong>预排除后</strong>
            <span>{activeResult.stats.filteredCandidates}</span>
          </div>
          <div className="stats-card">
            <strong>9 候选穷举</strong>
            <span>{activeResult.stats.enumerated9}</span>
          </div>
          <div className="stats-card">
            <strong>8 候选穷举</strong>
            <span>{activeResult.stats.enumerated8}</span>
          </div>
          <div className="stats-card">
            <strong>7 候选穷举</strong>
            <span>{activeResult.stats.enumerated7}</span>
          </div>
          <div className="stats-card">
            <strong>6 候选穷举</strong>
            <span>{activeResult.stats.enumerated6}</span>
          </div>
          <div className="stats-card">
            <strong>5 候选穷举</strong>
            <span>{activeResult.stats.enumerated5}</span>
          </div>
        </div>

        <div className="result-grid">
          {renderList("使用现有", activeResult.usingPieces)}
          {renderList("缺少形状", activeResult.missingShapes)}
          {renderList("缺少属性", activeResult.missingAttributes)}
          {renderList("建议补位", activeResult.suggestedPieces)}
          {renderList("优先替换", activeResult.replacementAdvice)}
        </div>
      </div>
    </div>
  );
}
