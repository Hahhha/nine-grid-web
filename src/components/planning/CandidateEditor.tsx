import { ELEMENT_LABELS, ELEMENT_SKILLS } from "../../data/elements";
import { BLUE_STAT_LABELS, RARITY_LABELS, SHAPE_LABELS, SUBSTAT_LABELS } from "../../data/options";
import type { PuzzlePiece } from "../../types/domain";

type Props = {
  piece: PuzzlePiece;
  onChange: (piece: PuzzlePiece) => void;
  onAdd: () => void;
};

export function CandidateEditor({ piece, onChange, onAdd }: Props) {
  const skills = ELEMENT_SKILLS[piece.element];

  return (
    <div className="section-stack">
      <div className="field-grid tight">
        <label className="field-label">形状</label>
        <select className="select" value={piece.shape} onChange={(e) => onChange({ ...piece, shape: e.target.value as PuzzlePiece["shape"] })}>
          {Object.entries(SHAPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        <label className="field-label">等级</label>
        <select className="select" value={piece.rarity} onChange={(e) => onChange({ ...piece, rarity: e.target.value as PuzzlePiece["rarity"] })}>
          {Object.entries(RARITY_LABELS).filter(([value]) => value === "blue" || value === "purple").map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        <label className="field-label">元素</label>
        <select
          className="select"
          value={piece.element}
          onChange={(e) =>
            onChange({
              ...piece,
              element: e.target.value as PuzzlePiece["element"],
              greenSkill: ELEMENT_SKILLS[e.target.value as PuzzlePiece["element"]][0],
              purpleSkill: ELEMENT_SKILLS[e.target.value as PuzzlePiece["element"]][0],
            })
          }
        >
          {Object.entries(ELEMENT_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        <label className="field-label">白色词条</label>
        <select className="select" value={piece.subStat} onChange={(e) => onChange({ ...piece, subStat: e.target.value as PuzzlePiece["subStat"] })}>
          {Object.entries(SUBSTAT_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        <label className="field-label">绿色词条</label>
        <select className="select" value={piece.greenSkill} onChange={(e) => onChange({ ...piece, greenSkill: e.target.value as PuzzlePiece["greenSkill"] })}>
          {skills.map((skill) => (
            <option key={skill} value={skill}>
              {skill}
            </option>
          ))}
        </select>

        <label className="field-label">蓝色词条</label>
        <select className="select" value={piece.blueStat} onChange={(e) => onChange({ ...piece, blueStat: e.target.value as PuzzlePiece["blueStat"] })}>
          {Object.entries(BLUE_STAT_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        <label className="field-label">紫色词条</label>
        <select className="select" value={piece.purpleSkill} onChange={(e) => onChange({ ...piece, purpleSkill: e.target.value as PuzzlePiece["purpleSkill"] })}>
          {skills.map((skill) => (
            <option key={skill} value={skill}>
              {skill}
            </option>
          ))}
        </select>
      </div>

      <div className="button-row">
        <button type="button" className="button primary" onClick={onAdd}>
          Add 候选拼图
        </button>
      </div>
    </div>
  );
}
