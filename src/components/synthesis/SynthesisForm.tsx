import { ELEMENT_LABELS, ELEMENT_SKILLS } from "../../data/elements";
import { BLUE_STAT_LABELS, RARITY_LABELS, SHAPE_LABELS, SUBSTAT_LABELS } from "../../data/options";
import type { SynthesisDraft } from "../../types/synthesis";

type Props = {
  draft: SynthesisDraft;
  onChange: (draft: SynthesisDraft) => void;
};

export function SynthesisForm({ draft, onChange }: Props) {
  const elementSkills = ELEMENT_SKILLS[draft.targetElement];

  return (
    <div className="field-grid tight">
      <label className="field-label">形状</label>
      <select
        className="select"
        value={draft.targetShape}
        onChange={(event) => onChange({ ...draft, targetShape: event.target.value as SynthesisDraft["targetShape"] })}
      >
        {Object.entries(SHAPE_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>

      <label className="field-label">目标等级</label>
      <select
        className="select"
        value={draft.targetRarity}
        onChange={(event) => onChange({ ...draft, targetRarity: event.target.value as SynthesisDraft["targetRarity"] })}
      >
        {Object.entries(RARITY_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>

      <label className="field-label">目标元素</label>
      <select
        className="select"
        value={draft.targetElement}
        onChange={(event) =>
          onChange({
            ...draft,
            targetElement: event.target.value as SynthesisDraft["targetElement"],
            greenSkill: ELEMENT_SKILLS[event.target.value as SynthesisDraft["targetElement"]][0],
            purpleSkill: ELEMENT_SKILLS[event.target.value as SynthesisDraft["targetElement"]][0],
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
      <select
        className="select"
        value={draft.subStat}
        onChange={(event) => onChange({ ...draft, subStat: event.target.value as SynthesisDraft["subStat"] })}
      >
        {Object.entries(SUBSTAT_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>

      <label className="field-label">绿色词条</label>
      <select
        className="select"
        value={draft.greenSkill}
        onChange={(event) => onChange({ ...draft, greenSkill: event.target.value as SynthesisDraft["greenSkill"] })}
      >
        {elementSkills.map((skill) => (
          <option key={skill} value={skill}>
            {skill}
          </option>
        ))}
      </select>

      <label className="field-label">蓝色词条</label>
      <select
        className="select"
        value={draft.blueStat}
        onChange={(event) => onChange({ ...draft, blueStat: event.target.value as SynthesisDraft["blueStat"] })}
      >
        {Object.entries(BLUE_STAT_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>

      <label className="field-label">紫色词条</label>
      <select
        className="select"
        value={draft.purpleSkill}
        onChange={(event) => onChange({ ...draft, purpleSkill: event.target.value as SynthesisDraft["purpleSkill"] })}
      >
        {elementSkills.map((skill) => (
          <option key={skill} value={skill}>
            {skill}
          </option>
        ))}
      </select>

      <label className="field-label">起始胚子</label>
      <select
        className="select"
        value={draft.startRarity}
        onChange={(event) => onChange({ ...draft, startRarity: event.target.value as SynthesisDraft["startRarity"] })}
      >
        <option value="white">白色起步</option>
        <option value="green">绿色起步</option>
        <option value="blue">蓝色起步</option>
      </select>
    </div>
  );
}
