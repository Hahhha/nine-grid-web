import ExcelJS from "exceljs";
import * as XLSX from "xlsx";
import { ELEMENT_LABELS, ELEMENT_SKILLS } from "../../data/elements";
import { BLUE_STAT_LABELS, RARITY_LABELS, SHAPE_LABELS, SUBSTAT_LABELS } from "../../data/options";
import type { BlueStat, Element, ElementSkill, PuzzlePiece, Rarity, Shape, SubStat } from "../../types/domain";
import type { PlanningGoal } from "../../types/planning";

const SHEET_GUIDE = "说明";
const SHEET_GOAL = "Goal";
const SHEET_CANDIDATES = "Candidates";
const SHEET_DICT = "字典";

const CANDIDATE_HEADERS = ["个数", "形状", "等级", "副属性", "元素词条1", "元素词条2", "蓝色词条", "备注"] as const;
const ALL_SKILLS = Object.values(ELEMENT_SKILLS).flat();

type ImportResult = {
  goal: PlanningGoal;
  candidates: PuzzlePiece[];
  summary: string;
};

type BatchImportResult = {
  candidates: PuzzlePiece[];
  summary: string;
};

type CandidateRowRecord = Record<(typeof CANDIDATE_HEADERS)[number], unknown>;

const SKILL_TO_ELEMENT = new Map<ElementSkill, Element>(
  Object.entries(ELEMENT_SKILLS).flatMap(([element, skills]) => skills.map((skill) => [skill, element as Element] as const)),
);

const shapeLookup = buildLookup<Shape>([
  ["O", "O"],
  ["O 田字格", "O"],
  ["I", "I"],
  ["I 长条", "I"],
  ["T", "T"],
  ["T 丁字格", "T"],
  ["L", "L"],
  ["L 形", "L"],
  ["J", "J"],
  ["J 对称 L", "J"],
]);

const rarityLookup = buildLookup<Rarity>([
  ["blue", "blue"],
  ["蓝色", "blue"],
  ["purple", "purple"],
  ["紫色", "purple"],
]);

const subStatLookup = buildLookup<SubStat>([
  ["crit", "crit"],
  ["会心", "crit"],
  ["tune", "tune"],
  ["调息", "tune"],
  ["mastery", "mastery"],
  ["专精", "mastery"],
  ["guard", "guard"],
  ["元御", "guard"],
]);

const blueStatLookup = buildLookup<BlueStat>([
  ["sameElementBoost", "sameElementBoost"],
  ["同元素增强", "sameElementBoost"],
  ["anyResistance", "anyResistance"],
  ["任意抵抗", "anyResistance"],
]);

const emptySkillLookup = new Set(["", "无", "none", "NONE", "None"]);

function buildLookup<T extends string>(entries: Array<[string, T]>) {
  const map = new Map<string, T>();
  entries.forEach(([raw, value]) => map.set(raw.trim(), value));
  return map;
}

function setColumnWidths(sheet: XLSX.WorkSheet, widths: number[]) {
  sheet["!cols"] = widths.map((wch) => ({ wch }));
}

function setExcelColumnWidths(sheet: ExcelJS.Worksheet, widths: number[]) {
  widths.forEach((width, index) => {
    sheet.getColumn(index + 1).width = width;
  });
}

function listFormula(values: string[]) {
  return `"${values.join(",")}"`;
}

function normalizeGoal(goal: PlanningGoal): PlanningGoal {
  const next: PlanningGoal = {
    element: goal.element,
    counts: {
      subStats: {
        crit: clampInt(goal.counts.subStats.crit, 9),
        tune: clampInt(goal.counts.subStats.tune, 9),
        mastery: clampInt(goal.counts.subStats.mastery, 9),
        guard: clampInt(goal.counts.subStats.guard, 9),
      },
      elementSkills: {},
      sameElementBoost: clampInt(goal.counts.sameElementBoost, 3),
    },
  };

  ELEMENT_SKILLS[goal.element].forEach((skill) => {
    next.counts.elementSkills[skill] = clampInt(goal.counts.elementSkills[skill], 5);
  });

  return next;
}

function clampInt(value: unknown, max: number) {
  if (value === undefined || value === null || String(value).trim() === "") return 0;
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, Math.min(max, Math.floor(numeric)));
}

function normalizeText(value: unknown) {
  return String(value ?? "").trim();
}

function requireMapped<T extends string>(lookup: Map<string, T>, value: unknown, field: string, rowLabel: string): T {
  const normalized = normalizeText(value);
  if (!normalized) throw new Error(`${rowLabel} 缺少“${field}”`);
  const mapped = lookup.get(normalized);
  if (!mapped) throw new Error(`${rowLabel} 的“${field}”不合法：${normalized}`);
  return mapped;
}

function requireSkill(value: unknown, field: string, rowLabel: string): ElementSkill {
  const normalized = normalizeText(value);
  if (!normalized) throw new Error(`${rowLabel} 缺少“${field}”`);
  if (!SKILL_TO_ELEMENT.has(normalized as ElementSkill)) {
    throw new Error(`${rowLabel} 的“${field}”不合法：${normalized}`);
  }
  return normalized as ElementSkill;
}

function isEmptySkill(value: unknown) {
  return emptySkillLookup.has(normalizeText(value));
}

function inferElement(skill1: ElementSkill, skill2: ElementSkill | undefined, rowLabel: string): Element {
  const element1 = SKILL_TO_ELEMENT.get(skill1);
  if (!element1) throw new Error(`${rowLabel} 的“元素词条1”无法识别元素`);
  if (!skill2) return element1;
  const element2 = SKILL_TO_ELEMENT.get(skill2);
  if (!element2) throw new Error(`${rowLabel} 的“元素词条2”无法识别元素`);
  if (element1 !== element2) {
    throw new Error(`${rowLabel} 的两个元素词条不属于同一元素`);
  }
  return element1;
}

function makeGuideSheet() {
  const rows = [
    ["用途", "说明"],
    ["1", "Goal 工作表只读取第 2 行；Candidates 工作表从第 2 行开始逐行读取。"],
    ["2", "Candidates 字段固定为：个数、形状、等级、副属性、元素词条1、元素词条2、蓝色词条、备注。"],
    ["3", "蓝色拼图：元素词条2 填“无”；紫色拼图：元素词条2 必须填写具体词条。"],
    ["4", "元素词条1 和 元素词条2 必须属于同一元素。程序会自动从词条反推出元素。"],
    ["5", "导入 Excel 会覆盖当前规划路线的已保存目标、候选集合和规划结果。"],
    ["6", "可直接复制 Candidates 里的多行，粘贴到网页端“批量添加候选”区域。"],
  ];
  const sheet = XLSX.utils.aoa_to_sheet(rows);
  setColumnWidths(sheet, [10, 92]);
  return sheet;
}

function makeDictSheet() {
  const rows: Array<Array<string>> = [
    ["分类", "可用值 1", "可用值 2", "可用值 3", "可用值 4", "可用值 5"],
    ["形状", "O 田字格", "I 长条", "T 丁字格", "L 形", "J 对称 L"],
    ["等级", "蓝色", "紫色", "", "", ""],
    ["副属性", "会心", "调息", "专精", "元御", ""],
    ["蓝色词条", "同元素增强", "任意抵抗", "", "", ""],
    ["元素词条2可空值", "无", "", "", "", ""],
    ["火词条", ...ELEMENT_SKILLS.fire],
    ["冰词条", ...ELEMENT_SKILLS.ice],
    ["雷词条", ...ELEMENT_SKILLS.thunder],
    ["木词条", ...ELEMENT_SKILLS.wood],
  ];
  const sheet = XLSX.utils.aoa_to_sheet(rows);
  setColumnWidths(sheet, [14, 18, 18, 18, 18, 18]);
  return sheet;
}

function emptyGoal(): PlanningGoal {
  return {
    element: "fire",
    counts: {
      subStats: { crit: 0, tune: 0, mastery: 0, guard: 0 },
      elementSkills: {},
      sameElementBoost: 0,
    },
  };
}

function goalDisplayRow(goal: PlanningGoal) {
  const normalized = normalizeGoal(goal);
  const row: Record<string, string | number> = {
    目标元素: ELEMENT_LABELS[normalized.element],
    会心: normalized.counts.subStats.crit ?? 0,
    调息: normalized.counts.subStats.tune ?? 0,
    专精: normalized.counts.subStats.mastery ?? 0,
    元御: normalized.counts.subStats.guard ?? 0,
    同元素增强: normalized.counts.sameElementBoost ?? 0,
  };
  ALL_SKILLS.forEach((skill) => {
    row[skill] = normalized.counts.elementSkills[skill] ?? 0;
  });
  return row;
}

function makeGoalSheet(goal: PlanningGoal) {
  const sheet = XLSX.utils.json_to_sheet([goalDisplayRow(goal)], { skipHeader: false });
  setColumnWidths(sheet, [10, 8, 8, 8, 8, 12, ...ALL_SKILLS.map(() => 16)]);
  return sheet;
}

function candidateKey(piece: PuzzlePiece) {
  return [piece.shape, piece.rarity, piece.subStat ?? "", piece.greenSkill ?? "", piece.purpleSkill ?? "", piece.blueStat ?? ""].join("|");
}

function groupCandidates(candidates: PuzzlePiece[]) {
  const grouped = new Map<string, { count: number; piece: PuzzlePiece }>();
  candidates.forEach((piece) => {
    const key = candidateKey(piece);
    const current = grouped.get(key);
    if (current) current.count += 1;
    else grouped.set(key, { count: 1, piece });
  });
  return [...grouped.values()];
}

function candidateDisplayRow(piece: PuzzlePiece, count: number) {
  return {
    个数: count,
    形状: SHAPE_LABELS[piece.shape],
    等级: RARITY_LABELS[piece.rarity],
    副属性: piece.subStat ? SUBSTAT_LABELS[piece.subStat] : "",
    元素词条1: piece.greenSkill ?? "",
    元素词条2: piece.rarity === "purple" ? piece.purpleSkill ?? "" : "无",
    蓝色词条: piece.blueStat ? BLUE_STAT_LABELS[piece.blueStat] : "",
    备注: piece.rarity === "blue" ? "蓝色第二词条填无" : "紫色第二词条必填",
  };
}

function templateCandidates() {
  return [
    candidateDisplayRow(
      {
        id: "template-blue",
        shape: "O",
        rarity: "blue",
        element: "fire",
        subStat: "crit",
        greenSkill: "天火陨星",
        blueStat: "sameElementBoost",
      },
      2,
    ),
    candidateDisplayRow(
      {
        id: "template-purple",
        shape: "T",
        rarity: "purple",
        element: "fire",
        subStat: "crit",
        greenSkill: "赤焰天环",
        blueStat: "sameElementBoost",
        purpleSkill: "烈焰焚身",
      },
      1,
    ),
  ];
}

function makeCandidatesSheet(candidates: PuzzlePiece[]) {
  const rows = candidates.length > 0 ? groupCandidates(candidates).map(({ count, piece }) => candidateDisplayRow(piece, count)) : templateCandidates();
  const sheet = XLSX.utils.json_to_sheet(rows, { header: [...CANDIDATE_HEADERS], skipHeader: false });
  setColumnWidths(sheet, [8, 12, 10, 10, 18, 18, 14, 28]);
  return sheet;
}

async function buildWorkbook(goal: PlanningGoal, candidates: PuzzlePiece[]) {
  const workbook = new ExcelJS.Workbook();
  const guideSheet = workbook.addWorksheet(SHEET_GUIDE);
  const goalSheet = workbook.addWorksheet(SHEET_GOAL);
  const candidatesSheet = workbook.addWorksheet(SHEET_CANDIDATES);
  const dictSheet = workbook.addWorksheet(SHEET_DICT);

  const guideRows = [
    ["用途", "说明"],
    ["1", "Goal 工作表只读取第 2 行；Candidates 工作表从第 2 行开始逐行读取。"],
    ["2", "Candidates 字段固定为：个数、形状、等级、副属性、元素词条1、元素词条2、蓝色词条、备注。"],
    ["3", "蓝色拼图：元素词条2 填“无”；紫色拼图：元素词条2 必须填写具体词条。"],
    ["4", "元素词条1 和 元素词条2 必须属于同一元素。程序会自动从词条反推出元素。"],
    ["5", "导入 Excel 会覆盖当前规划路线的已保存目标、候选集合和规划结果。"],
    ["6", "可直接复制 Candidates 里的多行，粘贴到网页端“批量添加候选”区域。"],
  ];
  guideRows.forEach((row) => guideSheet.addRow(row));
  setExcelColumnWidths(guideSheet, [10, 92]);

  const goalRow = goalDisplayRow(goal);
  const goalHeaders = Object.keys(goalRow);
  goalSheet.addRow(goalHeaders);
  goalSheet.addRow(goalHeaders.map((header) => goalRow[header]));
  setExcelColumnWidths(goalSheet, [10, 8, 8, 8, 8, 12, ...ALL_SKILLS.map(() => 16)]);
  goalSheet.getCell("A2").dataValidation = {
    type: "list",
    allowBlank: false,
    formulae: [listFormula(["火", "冰", "雷", "木"])],
    showErrorMessage: true,
  };

  const candidateRows = candidates.length > 0 ? groupCandidates(candidates).map(({ count, piece }) => candidateDisplayRow(piece, count)) : templateCandidates();
  candidatesSheet.addRow([...CANDIDATE_HEADERS]);
  candidateRows.forEach((row) => {
    candidatesSheet.addRow(CANDIDATE_HEADERS.map((header) => row[header]));
  });
  setExcelColumnWidths(candidatesSheet, [8, 12, 10, 10, 18, 18, 14, 28]);

  const shapeList = ["O 田字格", "I 长条", "T 丁字格", "L 形", "J 对称 L"];
  const rarityList = ["蓝色", "紫色"];
  const subStatList = ["会心", "调息", "专精", "元御"];
  const blueStatList = ["同元素增强", "任意抵抗"];
  const skillList = [...ALL_SKILLS];
  const skillListWithNone = [...ALL_SKILLS, "无"];

  for (let row = 2; row <= 300; row += 1) {
    candidatesSheet.getCell(`B${row}`).dataValidation = { type: "list", allowBlank: false, formulae: [listFormula(shapeList)] };
    candidatesSheet.getCell(`C${row}`).dataValidation = { type: "list", allowBlank: false, formulae: [listFormula(rarityList)] };
    candidatesSheet.getCell(`D${row}`).dataValidation = { type: "list", allowBlank: false, formulae: [listFormula(subStatList)] };
    candidatesSheet.getCell(`E${row}`).dataValidation = { type: "list", allowBlank: false, formulae: [listFormula(skillList)] };
    candidatesSheet.getCell(`F${row}`).dataValidation = { type: "list", allowBlank: false, formulae: [listFormula(skillListWithNone)] };
    candidatesSheet.getCell(`G${row}`).dataValidation = { type: "list", allowBlank: false, formulae: [listFormula(blueStatList)] };
  }

  const dictRows: Array<Array<string>> = [
    ["分类", "可用值 1", "可用值 2", "可用值 3", "可用值 4", "可用值 5"],
    ["形状", "O 田字格", "I 长条", "T 丁字格", "L 形", "J 对称 L"],
    ["等级", "蓝色", "紫色", "", "", ""],
    ["副属性", "会心", "调息", "专精", "元御", ""],
    ["蓝色词条", "同元素增强", "任意抵抗", "", "", ""],
    ["元素词条2可空值", "无", "", "", "", ""],
    ["火词条", ...ELEMENT_SKILLS.fire],
    ["冰词条", ...ELEMENT_SKILLS.ice],
    ["雷词条", ...ELEMENT_SKILLS.thunder],
    ["木词条", ...ELEMENT_SKILLS.wood],
  ];
  dictRows.forEach((row) => dictSheet.addRow(row));
  setExcelColumnWidths(dictSheet, [14, 18, 18, 18, 18, 18]);

  [guideSheet, goalSheet, candidatesSheet, dictSheet].forEach((sheet) => {
    sheet.getRow(1).font = { bold: true };
    sheet.views = [{ state: "frozen", ySplit: 1 }];
  });

  return workbook;
}

async function downloadWorkbook(workbook: ExcelJS.Workbook, fileName: string) {
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function downloadPlanningTemplate() {
  const workbook = await buildWorkbook(emptyGoal(), []);
  await downloadWorkbook(workbook, "九宫规划路线模板.xlsx");
}

export async function exportPlanningWorkbook(goal: PlanningGoal, candidates: PuzzlePiece[]) {
  const workbook = await buildWorkbook(goal, candidates);
  await downloadWorkbook(workbook, "九宫规划路线导出.xlsx");
}

export async function importPlanningWorkbook(file: File): Promise<ImportResult> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const goalSheet = workbook.Sheets[SHEET_GOAL];
  const candidatesSheet = workbook.Sheets[SHEET_CANDIDATES];
  if (!goalSheet) throw new Error(`缺少工作表：${SHEET_GOAL}`);
  if (!candidatesSheet) throw new Error(`缺少工作表：${SHEET_CANDIDATES}`);

  const goalRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(goalSheet, { defval: "" });
  const candidateRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(candidatesSheet, { defval: "" });
  if (goalRows.length === 0) throw new Error("Goal 工作表没有可读取的数据");

  const goal = parseGoalRow(goalRows[0]);
  const candidates = candidateRows.filter(isNonEmptyCandidateRow).flatMap((row, index) => parseCandidateRecord(row as CandidateRowRecord, `Candidates 第 ${index + 2} 行`, index));

  return {
    goal,
    candidates,
    summary: `已导入 1 套目标属性，${candidates.length} 个候选拼图`,
  };
}

export function importCandidatesFromText(raw: string): BatchImportResult {
  const lines = raw.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.length === 0) {
    throw new Error("批量添加内容为空，请先粘贴至少 1 行候选拼图。");
  }

  const candidates: PuzzlePiece[] = [];
  lines.forEach((line, index) => {
    const columns = line.includes("\t") ? line.split("\t").map((part) => part.trim()) : line.split(/[，,]/).map((part) => part.trim());
    if (columns.length === 0) return;
    if (index === 0 && columns.some((cell) => CANDIDATE_HEADERS.includes(cell as never))) return;
    const row = columnsToCandidateRecord(columns);
    candidates.push(...parseCandidateRecord(row, `批量添加第 ${index + 1} 行`, index));
  });

  if (candidates.length === 0) {
    throw new Error("没有识别到有效候选。请按“个数、形状、等级、副属性、元素词条1、元素词条2、蓝色词条”顺序粘贴。");
  }

  return {
    candidates,
    summary: `已批量识别 ${candidates.length} 个候选拼图`,
  };
}

function columnsToCandidateRecord(columns: string[]): CandidateRowRecord {
  if (columns.length < 7) {
    throw new Error(`批量添加存在无法识别的行：${columns.join(" | ")}`);
  }
  return {
    个数: columns[0],
    形状: columns[1],
    等级: columns[2],
    副属性: columns[3],
    元素词条1: columns[4],
    元素词条2: columns[5],
    蓝色词条: columns[6],
    备注: columns[7] ?? "",
  };
}

function parseGoalRow(row: Record<string, unknown>): PlanningGoal {
  const elementText = normalizeText(row["目标元素"]);
  const element = new Map<string, Element>([
    ["火", "fire"],
    ["fire", "fire"],
    ["冰", "ice"],
    ["ice", "ice"],
    ["雷", "thunder"],
    ["thunder", "thunder"],
    ["木", "wood"],
    ["wood", "wood"],
  ]).get(elementText);
  if (!element) throw new Error(`Goal 第 2 行的“目标元素”不合法：${elementText}`);

  const counts: PlanningGoal["counts"] = {
    subStats: {
      crit: clampInt(row["会心"], 9),
      tune: clampInt(row["调息"], 9),
      mastery: clampInt(row["专精"], 9),
      guard: clampInt(row["元御"], 9),
    },
    elementSkills: {},
    sameElementBoost: clampInt(row["同元素增强"], 3),
  };
  ELEMENT_SKILLS[element].forEach((skill) => {
    counts.elementSkills[skill] = clampInt(row[skill], 5);
  });
  return { element, counts };
}

function isNonEmptyCandidateRow(row: Record<string, unknown>) {
  return CANDIDATE_HEADERS.some((header) => normalizeText(row[header]) !== "");
}

function parseCandidateRecord(row: CandidateRowRecord, rowLabel: string, index: number): PuzzlePiece[] {
  const count = Math.max(1, clampInt(row["个数"], 999));
  const shape = requireMapped(shapeLookup, row["形状"], "形状", rowLabel);
  const rarity = requireMapped(rarityLookup, row["等级"], "等级", rowLabel);
  const subStat = requireMapped(subStatLookup, row["副属性"], "副属性", rowLabel);
  const skill1 = requireSkill(row["元素词条1"], "元素词条1", rowLabel);
  const rawSkill2 = row["元素词条2"];
  const skill2 = isEmptySkill(rawSkill2) ? undefined : requireSkill(rawSkill2, "元素词条2", rowLabel);
  const blueStat = requireMapped(blueStatLookup, row["蓝色词条"], "蓝色词条", rowLabel);

  if (rarity === "blue" && skill2) {
    throw new Error(`${rowLabel} 为蓝色拼图，“元素词条2”必须填“无”`);
  }
  if (rarity === "purple" && !skill2) {
    throw new Error(`${rowLabel} 为紫色拼图，“元素词条2”必须填写具体词条`);
  }

  const element = inferElement(skill1, skill2, rowLabel);
  return Array.from({ length: count }, (_, offset) => ({
    id: `imported-${Date.now()}-${index + 1}-${offset + 1}-${Math.random().toString(16).slice(2, 6)}`,
    shape,
    rarity,
    element,
    subStat,
    greenSkill: skill1,
    blueStat,
    purpleSkill: rarity === "purple" ? skill2 : undefined,
  }));
}
