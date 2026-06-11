import { CLASSES, PHASES } from "../data/index.js";

/**
 * Shared, mutable application state.
 * `view` is either "class" (BiS by class/spec) or "item" (reverse lookup).
 */
export const state = {
  view: "class",
  classId: CLASSES[0].id,
  specId: CLASSES[0].specs[0].id,
  phaseId: PHASES[0].id,
  slotId: "all",
  areaId: "all",
  search: "",
};

export function getClass(id) {
  return CLASSES.find((c) => c.id === id);
}
