import type { PlacementSolution } from "../../types/placement";

type Props = {
  solution: PlacementSolution;
};

const PIECE_COLORS = [
  "#f97316",
  "#8b5cf6",
  "#0ea5e9",
  "#22c55e",
  "#ef4444",
  "#f59e0b",
  "#14b8a6",
  "#ec4899",
  "#6366f1",
];

function rowsForBoard() {
  const top = [null, 0, 1, 2, 3, null];
  const rows: Array<Array<number | null>> = [top];
  for (let row = 0; row < 6; row += 1) {
    const cells: Array<number | null> = [];
    for (let col = 0; col < 6; col += 1) {
      cells.push(4 + row * 6 + col);
    }
    rows.push(cells);
  }
  return rows;
}

export function PlacementBoard({ solution }: Props) {
  const cellStyleMap = new Map<number, { label: string; color: string; kind: "permanent" | "piece" }>();

  solution.occupiedCells.forEach((entry, index) => {
    const color = entry.kind === "permanent" ? "#111827" : PIECE_COLORS[index % PIECE_COLORS.length];
    entry.cells.forEach((cell) => {
      cellStyleMap.set(cell, { label: entry.label, color, kind: entry.kind });
    });
  });

  return (
    <div className="placement-board-wrap">
      <div className="placement-board">
        {rowsForBoard().map((row, rowIndex) => (
          <div key={`row-${rowIndex}`} className="placement-board-row">
            {row.map((cell, colIndex) => {
              if (cell === null) {
                return <div key={`empty-${rowIndex}-${colIndex}`} className="placement-board-gap" />;
              }
              const style = cellStyleMap.get(cell);
              return (
                <div
                  key={`cell-${cell}`}
                  className={style ? "placement-cell filled" : "placement-cell"}
                  style={style ? { backgroundColor: style.color } : undefined}
                  title={style?.label ?? `空格 ${cell + 1}`}
                >
                  <span>{style?.kind === "permanent" ? "O" : style?.label.replace(/@.*/, "") ?? ""}</span>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div className="placement-legend">
        {solution.occupiedCells.map((entry, index) => {
          const color = entry.kind === "permanent" ? "#111827" : PIECE_COLORS[index % PIECE_COLORS.length];
          return (
            <div key={`${entry.label}-${index}`} className="placement-legend-item">
              <span className="placement-legend-swatch" style={{ backgroundColor: color }} />
              <span>{entry.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
