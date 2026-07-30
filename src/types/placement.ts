import type { Shape } from "./domain";

export type PlacementSolution = {
  id: string;
  line: string;
  placed: number;
  flex: number;
  skipped: number;
  permanentAnchor: number;
  steps: string[];
  occupiedCells: Array<{
    label: string;
    cells: number[];
    kind: "permanent" | "piece";
  }>;
};

export type PlacementSearchResult = {
  solutions: PlacementSolution[];
  diagnostics: string;
};

export type PlacementShapeItem = {
  id: string;
  shape: Shape;
};
