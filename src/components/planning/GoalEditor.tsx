import { ELEMENT_LABELS, ELEMENT_SKILLS } from "../../data/elements";
import { SUBSTAT_LABELS } from "../../data/options";
import type { PlanningGoal } from "../../types/planning";

type Props = {
  goal: PlanningGoal;
  onChange: (goal: PlanningGoal) => void;
};

export function GoalEditor({ goal, onChange }: Props) {
  const skills = ELEMENT_SKILLS[goal.element];

  const parseCount = (raw: string, max: number) => {
    if (raw.trim() === "") return 0;
    const value = Number(raw);
    if (!Number.isFinite(value)) return 0;
    return Math.max(0, Math.min(max, Math.floor(value)));
  };

  const displayCount = (value: number | undefined) => {
    const safe = value ?? 0;
    return safe === 0 ? "" : String(safe);
  };

  return (
    <div className="section-stack">
      <div className="field-grid tight">
        <label className="field-label">目标元素</label>
        <select
          className="select"
          value={goal.element}
          onChange={(event) =>
            onChange({
              ...goal,
              element: event.target.value as PlanningGoal["element"],
              counts: {
                ...goal.counts,
                elementSkills: {},
              },
            })
          }
        >
          {Object.entries(ELEMENT_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="field-grid tight">
        {Object.entries(SUBSTAT_LABELS).map(([key, label]) => (
          <div key={key} className="field-pair">
            <label className="field-label">
              {label}
            </label>
            <input
              className="input"
              type="number"
              min={0}
              max={9}
              inputMode="numeric"
              value={displayCount(goal.counts.subStats[key as keyof typeof goal.counts.subStats])}
              onChange={(event) =>
                onChange({
                  ...goal,
                  counts: {
                    ...goal.counts,
                    subStats: {
                      ...goal.counts.subStats,
                      [key]: parseCount(event.target.value, 9),
                    },
                  },
                })
              }
            />
          </div>
        ))}

        <div className="field-pair" key="same-element-boost">
          <label className="field-label">同元素增强</label>
          <input
            className="input"
            type="number"
            min={0}
            max={3}
            inputMode="numeric"
            value={displayCount(goal.counts.sameElementBoost)}
            onChange={(event) =>
              onChange({
                ...goal,
                counts: {
                  ...goal.counts,
                  sameElementBoost: parseCount(event.target.value, 3),
                },
              })
            }
          />
        </div>
      </div>

      <div className="field-grid tight">
        {skills.map((skill) => (
          <div key={skill} className="field-pair">
            <label className="field-label">
              {skill}
            </label>
            <input
              className="input"
              type="number"
              min={0}
              max={5}
              inputMode="numeric"
              value={displayCount(goal.counts.elementSkills[skill])}
              onChange={(event) =>
                onChange({
                  ...goal,
                  counts: {
                    ...goal.counts,
                    elementSkills: {
                      ...goal.counts.elementSkills,
                      [skill]: parseCount(event.target.value, 5),
                    },
                  },
                })
              }
            />
          </div>
        ))}
      </div>
    </div>
  );
}
