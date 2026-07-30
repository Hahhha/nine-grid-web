import { BLUE_STAT_LABELS, RARITY_LABELS, SHAPE_LABELS, SUBSTAT_LABELS } from "../../data/options";
import type { PuzzlePiece } from "../../types/domain";

type Props = {
  pieces: PuzzlePiece[];
  onRemove: (id: string) => void;
  onClear: () => void;
};

function formatPiece(piece: PuzzlePiece) {
  const parts = [
    SHAPE_LABELS[piece.shape],
    RARITY_LABELS[piece.rarity],
    `白:${piece.subStat ? SUBSTAT_LABELS[piece.subStat] : "空"}`,
    `绿:${piece.greenSkill ?? "空"}`,
    `蓝:${piece.blueStat ? BLUE_STAT_LABELS[piece.blueStat] : "空"}`,
  ];

  if (piece.rarity === "purple") {
    parts.push(`紫:${piece.purpleSkill ?? "空"}`);
  }

  return parts.join(" · ");
}

export function CandidateList({ pieces, onRemove, onClear }: Props) {
  return (
    <div className="section-stack">
      <div className="button-row">
        <button type="button" className="button secondary" onClick={onClear}>
          清空候选集合
        </button>
      </div>
      <div className="candidate-list">
        {pieces.length === 0 ? (
          <div className="placeholder-box">
            <p className="muted">还没有加入候选拼图。</p>
          </div>
        ) : (
          pieces.map((piece, index) => (
            <div className="candidate-item" key={piece.id}>
              <p>
                <strong>{index + 1}.</strong> {formatPiece(piece)}
              </p>
              <div className="button-row" style={{ marginTop: 10 }}>
                <button type="button" className="button secondary" onClick={() => onRemove(piece.id)}>
                  删除
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
