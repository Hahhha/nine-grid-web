import generatedTargets from "./legalShapeTargets.generated.json";

export type ShapeTarget = {
  O: number;
  I: number;
  T: number;
  L: number;
  J: number;
};

export const LEGAL_SHAPE_TARGETS: ShapeTarget[] = generatedTargets as ShapeTarget[];
