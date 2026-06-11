import { CLASSES, PHASES, SLOTS, BIS } from "../data/index.js";
import { state } from "../core/state.js";
import { els } from "../core/dom.js";
import { areaOf } from "../core/areas.js";
import { getItemIndex } from "../core/itemIndex.js";

const VIEWS = [
  { id: "class", label: "By Class" },
  { id: "item", label: "By Item" },
];

export function renderViewTabs() {
  els.viewTabs.innerHTML = "";
  VIEWS.forEach((v) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "view-tab" + (v.id === state.view ? " active" : "");
    btn.dataset.view = v.id;
    btn.textContent = v.label;
    els.viewTabs.appendChild(btn);
  });
}

export function renderClasses() {
  els.classList.innerHTML = "";
  CLASSES.forEach((cls) => {
    const li = document.createElement("li");
    li.textContent = cls.name;
    li.style.color = cls.color;
    li.dataset.id = cls.id;
    li.classList.toggle("active", cls.id === state.classId);
    els.classList.appendChild(li);
  });
}

export function renderPhaseOptions() {
  els.phaseSelect.innerHTML = "";
  PHASES.forEach((p) => {
    const opt = document.createElement("option");
    opt.value = p.id;
    opt.textContent = p.name;
    opt.title = p.detail;
    els.phaseSelect.appendChild(opt);
  });
  els.phaseSelect.value = state.phaseId;
}

export function renderSlotOptions() {
  els.slotSelect.innerHTML = '<option value="all">All slots</option>';
  SLOTS.forEach((s) => {
    const opt = document.createElement("option");
    opt.value = s.id;
    opt.textContent = s.name;
    els.slotSelect.appendChild(opt);
  });
  els.slotSelect.value = state.slotId;
}

function specData() {
  return (
    (BIS[state.classId] &&
      BIS[state.classId][state.specId] &&
      BIS[state.classId][state.specId][state.phaseId]) ||
    null
  );
}

/** Area options depend on the current view: the active spec/phase in class
 * view, or the entire item index in item view. */
export function renderAreaOptions() {
  const areas = new Set();

  if (state.view === "item") {
    getItemIndex().forEach((rec) => {
      rec.usages.forEach((u) => areas.add(areaOf(u.source)));
    });
  } else {
    const data = specData();
    if (data) {
      SLOTS.forEach((slot) => {
        (data[slot.id] || []).forEach((e) => areas.add(areaOf(e.source)));
      });
    }
  }

  const sorted = [...areas].sort();
  if (!sorted.includes(state.areaId)) state.areaId = "all";

  els.areaSelect.innerHTML = '<option value="all">All areas</option>';
  sorted.forEach((a) => {
    const opt = document.createElement("option");
    opt.value = a;
    opt.textContent = a;
    els.areaSelect.appendChild(opt);
  });
  els.areaSelect.value = state.areaId;
}

/** Toggle which controls are visible for the current view. Phase only
 * applies in class view, so its toolbar select is hidden in item view. */
export function syncSidebarForView() {
  const isClass = state.view === "class";
  els.classGroup.hidden = !isClass;
  els.phaseSelect.hidden = !isClass;
}
