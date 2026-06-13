import { PHASES, SLOTS, getSpecData } from "../data/index.js";
import { state, getClass } from "../core/state.js";
import { els } from "../core/dom.js";
import { areaOf } from "../core/areas.js";
import { wowheadLink, refreshTooltips } from "../core/wowhead.js";
import { tierBadgeClass } from "../core/tiers.js";

function specData() {
  return getSpecData(state.classId, state.specId, state.phaseId);
}

function matchesFilters(entry) {
  if (state.areaId !== "all" && areaOf(entry.source) !== state.areaId) return false;
  const q = state.search.trim().toLowerCase();
  if (
    q &&
    !entry.name.toLowerCase().includes(q) &&
    !(entry.source || "").toLowerCase().includes(q)
  ) {
    return false;
  }
  return true;
}

function optionHtml(entry, i) {
  const tier = entry.tier || (i === 0 ? "BIS" : "ALT");
  const tierClass = tierBadgeClass(tier);
  const isPlaceholder = entry.name.startsWith("—");
  const qClass = isPlaceholder ? "q-none" : `q-${entry.quality || "epic"}`;
  const nameHtml = isPlaceholder
    ? `<span class="item-name ${qClass}">${entry.name}</span>`
    : `<a class="item-name ${qClass}" href="${wowheadLink(entry)}" data-wowhead="domain=tbc" target="_blank" rel="noopener">${entry.name}</a>`;
  return `
    <div class="option">
      <div class="option-main">
        <span class="rank-num">#${i + 1}</span>
        ${nameHtml}
        <span class="tier-badge ${tierClass}">${tier}</span>
      </div>
      <div class="item-source">${entry.source || ""}</div>
    </div>`;
}

const ROLE_ICON = { dps: "⚔", tank: "🛡", healer: "✚" };

/** Inline spec selector shown next to the class name: one button per spec
 * with the spec's WoW icon on the left and a role icon on the right. */
function specSwitchHtml(cls) {
  return cls.specs
    .map((s) => {
      const role = s.role || "dps";
      const active = s.id === state.specId ? " active" : "";
      return `
        <button type="button" class="spec-pick${active}" data-spec="${s.id}"
          title="${s.name}" aria-pressed="${s.id === state.specId}">
          <img class="spec-icon" alt="" loading="lazy"
            src="https://wow.zamimg.com/images/wow/icons/small/${s.icon}.jpg" />
          <span class="spec-name">${s.name}</span>
          <span class="role-icon role-${role}" aria-hidden="true">${ROLE_ICON[role] || ROLE_ICON.dps}</span>
        </button>`;
    })
    .join('<span class="spec-sep" aria-hidden="true">/</span>');
}

export function renderClassView() {
  const cls = getClass(state.classId);
  const spec = cls.specs.find((s) => s.id === state.specId);
  const phase = PHASES.find((p) => p.id === state.phaseId);

  els.resultHeader.innerHTML = `
    <div class="result-title">
      <h2 class="class-name" style="color:${cls.color}">${cls.name}</h2>
      <span class="title-dot" aria-hidden="true">·</span>
      <div class="spec-switch" role="tablist" aria-label="Specialization">${specSwitchHtml(cls)}</div>
    </div>
    <div class="phase-tag">${phase.name} — ${phase.detail}</div>
  `;

  const data = specData();
  els.bisList.innerHTML = "";

  if (!data) {
    els.bisList.innerHTML = `
      <div class="empty-state">
        <span class="big">📜</span>
        No BiS data yet for <strong>${spec.name}</strong> in
        <strong>${phase.name}</strong>.
      </div>`;
    return;
  }

  const slotsToShow =
    state.slotId === "all" ? SLOTS : SLOTS.filter((s) => s.id === state.slotId);
  const maxPerSlot = state.slotId === "all" ? 2 : 5;

  let rendered = 0;
  slotsToShow.forEach((slot) => {
    const entries = (data[slot.id] || []).filter(matchesFilters);
    if (!entries.length) return;

    const optionsHtml = entries.slice(0, maxPerSlot).map(optionHtml).join("");
    const isActiveSlot = state.slotId === slot.id;

    const block = document.createElement("div");
    block.className = "slot-block";
    block.innerHTML = `
      <div class="slot-label">
        <button type="button" class="slot-label-link${isActiveSlot ? " active" : ""}"
          data-slot="${slot.id}" title="Filter to ${slot.name}">${slot.name}</button>
      </div>
      <div class="options">${optionsHtml}</div>`;
    els.bisList.appendChild(block);
    rendered++;
  });

  if (rendered === 0) {
    els.bisList.innerHTML = `
      <div class="empty-state">
        <span class="big">🔍</span>
        No items match your filters.
      </div>`;
  }

  refreshTooltips();
}
