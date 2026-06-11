import { state } from "../core/state.js";
import { els } from "../core/dom.js";
import { areaOf } from "../core/areas.js";
import { wowheadLink, refreshTooltips } from "../core/wowhead.js";
import { getItemIndex } from "../core/itemIndex.js";

function usageMatchesFilters(u) {
  if (state.slotId !== "all" && u.slotId !== state.slotId) return false;
  if (state.areaId !== "all" && areaOf(u.source) !== state.areaId) return false;
  return true;
}

function itemMatchesSearch(rec) {
  const q = state.search.trim().toLowerCase();
  if (!q) return true;
  if (rec.name.toLowerCase().includes(q)) return true;
  return rec.usages.some((u) => (u.source || "").toLowerCase().includes(q));
}

/** Compress a list of phase numbers into a compact label:
 * consecutive runs become "1>2", gaps are comma-separated → "1>2, 4". */
function formatPhaseRuns(nums) {
  const sorted = [...new Set(nums)].sort((a, b) => a - b);
  const parts = [];
  let start = sorted[0];
  let prev = sorted[0];
  for (let i = 1; i <= sorted.length; i++) {
    const n = sorted[i];
    if (n === prev + 1) {
      prev = n;
      continue;
    }
    parts.push(start === prev ? `${start}` : `${start}>${prev}`);
    start = n;
    prev = n;
  }
  return parts.join(", ");
}

/** Build the grouped class → spec/slot chip structure for an item, collapsing
 * the same spec/slot across multiple phases into a single chip. Returns the
 * HTML plus the number of distinct spec/slot usages rendered. */
function buildUsages(usages) {
  const byClass = new Map();
  let chipCount = 0;

  usages.forEach((u) => {
    if (!byClass.has(u.classId)) {
      byClass.set(u.classId, { name: u.className, color: u.color, groups: new Map() });
    }
    const cls = byClass.get(u.classId);
    const gkey = `${u.specName}|${u.slotId}`;
    if (!cls.groups.has(gkey)) {
      cls.groups.set(gkey, { specName: u.specName, slotName: u.slotName, tiers: {} });
    }
    const g = cls.groups.get(gkey);
    const phaseNum = Number(String(u.phaseId).replace("p", ""));
    (g.tiers[u.tier] || (g.tiers[u.tier] = [])).push(phaseNum);
  });

  const html = [...byClass.values()]
    .map((cls) => {
      const chips = [...cls.groups.values()]
        .map((g) => {
          chipCount++;
          const badges = ["BIS", "ALT"]
            .filter((t) => g.tiers[t] && g.tiers[t].length)
            .map((t) => {
              const tierClass = t === "BIS" ? "tier-bis" : "tier-alt";
              return `<span class="tier-badge ${tierClass}">${t} ${formatPhaseRuns(g.tiers[t])}</span>`;
            })
            .join("");
          return `<span class="usage-chip">
              <span class="usage-spec">${g.specName}</span>
              <span class="usage-meta">${g.slotName}</span>
              ${badges}
            </span>`;
        })
        .join("");
      return `
        <div class="usage-class">
          <span class="usage-class-name" style="color:${cls.color}">${cls.name}</span>
          <div class="usage-chips">${chips}</div>
        </div>`;
    })
    .join("");

  return { html, chipCount };
}

export function renderItemView() {
  els.resultHeader.innerHTML = `
    <h2>Item Lookup</h2>
    <div class="phase-tag">Every item and the classes / specs it is BiS for</div>
  `;
  renderItemList();
}

/** Render only the item-card list for the current filters. Split from
 * renderItemView so changing the slot filter doesn't rebuild the header or
 * trigger a full route re-render. */
export function renderItemList() {
  els.bisList.innerHTML = "";

  // Don't render the full catalogue up front: require either a slot filter
  // or a search of at least 3 characters before listing items.
  const query = state.search.trim();
  if (state.slotId === "all" && query.length < 3) {
    els.bisList.innerHTML = `
      <div class="empty-state">
        <span class="big">🔍</span>
        Search for an item (3+ letters) or pick a slot to see results.
      </div>`;
    return;
  }

  const records = getItemIndex()
    .filter(itemMatchesSearch)
    .map((rec) => ({ rec, usages: rec.usages.filter(usageMatchesFilters) }))
    .filter((x) => x.usages.length > 0);

  if (records.length === 0) {
    els.bisList.innerHTML = `
      <div class="empty-state">
        <span class="big">🔍</span>
        No items match your filters.
      </div>`;
    return;
  }

  records.forEach(({ rec, usages }) => {
    const qClass = `q-${rec.quality || "epic"}`;
    const nameHtml = `<a class="item-name ${qClass}" href="${wowheadLink(rec)}" data-wowhead="domain=tbc" target="_blank" rel="noopener">${rec.name}</a>`;

    const { html, chipCount } = buildUsages(usages);

    const card = document.createElement("div");
    card.className = "item-card";
    card.innerHTML = `
      <div class="item-card-head">
        ${nameHtml}
        <span class="item-card-count">${chipCount} use${chipCount > 1 ? "s" : ""}</span>
      </div>
      <div class="item-card-source">${rec.source || ""}</div>
      <div class="usage-classes">${html}</div>`;
    els.bisList.appendChild(card);
  });

  refreshTooltips();
}
