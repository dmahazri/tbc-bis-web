import { BIS, CLASSES, PHASES, SLOTS } from "../data/index.js";

const SLOT_NAME = Object.fromEntries(SLOTS.map((s) => [s.id, s.name]));

function isPlaceholder(entry) {
  return !entry || !entry.name || entry.name.startsWith("—");
}

/**
 * Build a reverse index: every distinct item -> the list of class/spec/phase
 * slots for which it is listed as BiS or an alternate.
 *
 * Returns an array of records sorted by item name:
 *   { name, id, quality, source, slots:Set<slotId>, usages:[{...}] }
 */
let cache = null;

export function getItemIndex() {
  if (cache) return cache;

  const map = new Map();

  CLASSES.forEach((cls) => {
    const classBis = BIS[cls.id];
    if (!classBis) return;

    cls.specs.forEach((spec) => {
      const specBis = classBis[spec.id];
      if (!specBis) return;

      PHASES.forEach((phase) => {
        const phaseBis = specBis[phase.id];
        if (!phaseBis) return;

        SLOTS.forEach((slot) => {
          (phaseBis[slot.id] || []).forEach((entry) => {
            if (isPlaceholder(entry)) return;

            const key = entry.id ? `id:${entry.id}` : `nm:${entry.name.toLowerCase()}`;
            let rec = map.get(key);
            if (!rec) {
              rec = {
                name: entry.name,
                id: entry.id,
                quality: entry.quality,
                source: entry.source,
                slots: new Set(),
                usages: [],
              };
              map.set(key, rec);
            }
            rec.slots.add(slot.id);
            rec.usages.push({
              classId: cls.id,
              className: cls.name,
              color: cls.color,
              specName: spec.name,
              phaseId: phase.id,
              phaseShort: phase.id.toUpperCase(),
              slotId: slot.id,
              slotName: SLOT_NAME[slot.id],
              tier: entry.tier || "BIS",
              source: entry.source,
            });
          });
        });
      });
    });
  });

  cache = [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
  return cache;
}
