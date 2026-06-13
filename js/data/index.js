import { PHASES, SLOTS, CLASSES, it } from "./meta.js";
import { warrior } from "./warrior.js";
import { paladin } from "./paladin.js";
import { hunter } from "./hunter.js";
import { rogue } from "./rogue.js";
import { priest } from "./priest.js";
import { shaman } from "./shaman.js";
import { mage } from "./mage.js";
import { warlock } from "./warlock.js";
import { druid } from "./druid.js";

export const BIS = {
  warrior,
  paladin,
  hunter,
  rogue,
  priest,
  shaman,
  mage,
  warlock,
  druid,
};

const PHASE_ORDER = PHASES.map((p) => p.id);

/**
 * Resolve a spec's gear for a phase, cumulatively merging all earlier phases.
 *
 * The selected phase's curated list is kept first (so current best-in-slot
 * stays on top), then items from earlier phases (most recent first) that have
 * not already appeared are appended. This way gear that is still BiS in the
 * selected phase carries forward instead of disappearing when the addon guide
 * doesn't relist it.
 */
export function getSpecData(classId, specId, phaseId) {
  const spec = BIS[classId] && BIS[classId][specId];
  if (!spec) return null;

  const idx = PHASE_ORDER.indexOf(phaseId);
  if (idx < 0) return spec[phaseId] || null;

  const merged = {};
  const seen = {};
  for (let i = idx; i >= 0; i--) {
    const data = spec[PHASE_ORDER[i]];
    if (!data) continue;
    for (const slotId of Object.keys(data)) {
      const arr = data[slotId];
      if (!arr || !arr.length) continue;
      const list = merged[slotId] || (merged[slotId] = []);
      const seenSet = seen[slotId] || (seen[slotId] = new Set());
      for (const entry of arr) {
        const key = entry.id != null ? `id:${entry.id}` : `nm:${entry.name}`;
        if (seenSet.has(key)) continue;
        seenSet.add(key);
        list.push(entry);
      }
    }
  }
  return Object.keys(merged).length ? merged : null;
}

export { PHASES, SLOTS, CLASSES, it };
