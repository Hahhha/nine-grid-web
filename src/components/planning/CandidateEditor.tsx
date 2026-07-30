import { useState } from "react";
import { ELEMENT_LABELS, ELEMENT_SKILLS } from "../../data/elements";
import { BLUE_STAT_LABELS, RARITY_LABELS, SHAPE_LABELS, SUBSTAT_LABELS } from "../../data/options";
import type { PuzzlePiece } from "../../types/domain";

type Props = {
  piece: PuzzlePiece;
  onChange: (piece: PuzzlePiece) => void;
  onAdd: () => void;
  onBatchAdd: (raw: string) => string;
};

export function CandidateEditor({ piece, onChange, onAdd, onBatchAdd }: Props) {
  const skills = ELEMENT_SKILLS[piece.element];
  const isPurple = piece.rarity === "purple";
  const [batchInput, setBatchInput] = useState("");
  const [batchMessage, setBatchMessage] = useState("");

  const handleBatchAdd = () => {
    const message = onBatchAdd(batchInput);
    setBatchMessage(message);
    if (!message.startsWith("批量添加失败")) {
      setBatchInput("");
    }
  };

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
        <select
          className="select"
          value={piece.rarity}
          onChange={(e) => {
            const nextRarity = e.target.value as PuzzlePiece["rarity"];
            onChange({
              ...piece,
              rarity: nextRarity,
              purpleSkill: nextRarity === "purple" ? piece.purpleSkill ?? skills[0] : undefined,
            });
          }}
        >
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
              purpleSkill: piece.rarity === "purple" ? ELEMENT_SKILLS[e.target.value as PuzzlePiece["element"]][0] : undefined,
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

        {isPurple ? (
          <>
            <label className="field-label">紫色词条</label>
            <select className="select" value={piece.purpleSkill ?? skills[0]} onChange={(e) => onChange({ ...piece, purpleSkill: e.target.value as PuzzlePiece["purpleSkill"] })}>
              {skills.map((skill) => (
                <option key={skill} value={skill}>
                  {skill}
                </option>
              ))}
            </select>
          </>
        ) : null}
      </div>

      <div className="button-row">
        <button type="button" className="button primary" onClick={onAdd}>
          Add 候选拼图
        </button>
      </div>

      <div className="summary-box section-stack">
        <div>
          <p className="mini-note">批量添加候选</p>
          <p className="helper-text" style={{ marginTop: 6 }}>
            可直接粘贴 Excel 的 Candidates 多行。当前按“个数、形状、等级、副属性、元素词条1、元素词条2、蓝色词条、备注”读取；蓝色时元素词条2填“无”。
          </p>
        </div>
        <textarea
          className="textarea"
          value={batchInput}
          onChange={(event) => setBatchInput(event.target.value)}
          placeholder={"示例：\n2\tO 田字格\t蓝色\t会心\t天火陨星\t无\t同元素增强\n1\tT 丁字格\t紫色\t会心\t赤焰天环\t烈焰焚身\t同元素增强"}
          rows={6}
        />
        <div className="button-row">
          <button type="button" className="button secondary" onClick={handleBatchAdd}>
            批量添加
          </button>
        </div>
        {batchMessage ? <div className="stats-strip"><span>{batchMessage}</span></div> : null}
      </div>
    </div>
  );
}
