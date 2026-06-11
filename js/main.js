import { CLASSES, SLOTS } from "./data/index.js";
import { state, getClass } from "./core/state.js";
import { els } from "./core/dom.js";
import { buildHash, parseHash } from "./core/router.js";
import {
  renderViewTabs,
  renderClasses,
  renderSlotMenu,
  renderPhaseOptions,
  renderSlotOptions,
  renderAreaOptions,
  syncSidebarForView,
} from "./views/controls.js";
import { renderClassView } from "./views/classView.js";
import { renderItemView, renderItemList } from "./views/itemView.js";

function renderActiveView() {
  if (state.view === "item") renderItemView();
  else renderClassView();
}

/* ---- Routing ---- */
function applyRoute() {
  const route = parseHash();
  state.view = route.view;

  if (route.view === "class") {
    const classId =
      route.classId && getClass(route.classId) ? route.classId : CLASSES[0].id;
    state.classId = classId;
    const cls = getClass(classId);
    state.specId =
      route.specId && cls.specs.some((s) => s.id === route.specId)
        ? route.specId
        : cls.specs[0].id;
    state.slotId =
      route.slotId !== "all" && SLOTS.some((s) => s.id === route.slotId)
        ? route.slotId
        : "all";
  }
  // Item view: the slot filter is driven by the side menu (local state),
  // so there's nothing to resolve from the hash here.

  renderViewTabs();
  syncSidebarForView();
  renderClasses();
  renderSlotMenu();
  renderAreaOptions();
  els.slotSelect.value = state.slotId;
  renderActiveView();
}

function navigate({
  view = state.view,
  classId = state.classId,
  specId = state.specId,
  slotId = state.slotId,
}) {
  const next = buildHash({ view, classId, specId, slotId });
  if (location.hash === next) applyRoute(); // same hash: re-apply, no history spam
  else location.hash = next; // triggers hashchange -> applyRoute
}

/* ---- State transitions ---- */
function selectClass(id) {
  const cls = getClass(id);
  navigate({ view: "class", classId: id, specId: cls.specs[0].id, slotId: "all" });
}

function selectSpec(id) {
  navigate({ view: "class", specId: id });
}

function goToView(view) {
  if (view === "item") navigate({ view: "item" });
  else navigate({ view: "class", slotId: "all" });
}

/* ---- Events (delegated where possible) ---- */
els.viewTabs.addEventListener("click", (e) => {
  const btn = e.target.closest(".view-tab");
  if (btn) goToView(btn.dataset.view);
});

els.classList.addEventListener("click", (e) => {
  const li = e.target.closest("li[data-id]");
  if (li) selectClass(li.dataset.id);
});

// Slot side menu (item view): change the filter and re-render only the item
// list, avoiding a full route re-render of the whole page.
els.slotList.addEventListener("click", (e) => {
  const li = e.target.closest("li[data-id]");
  if (!li) return;
  state.slotId = li.dataset.id;
  renderSlotMenu();
  renderAreaOptions();
  renderItemList();
});

els.resultHeader.addEventListener("click", (e) => {
  const btn = e.target.closest(".spec-pick[data-spec]");
  if (btn) selectSpec(btn.dataset.spec);
});

els.phaseSelect.addEventListener("change", (e) => {
  state.phaseId = e.target.value;
  renderAreaOptions();
  renderActiveView();
});

els.slotSelect.addEventListener("change", (e) => {
  navigate({ slotId: e.target.value });
});

els.areaSelect.addEventListener("change", (e) => {
  state.areaId = e.target.value;
  renderActiveView();
});

els.searchInput.addEventListener("input", (e) => {
  state.search = e.target.value;
  renderActiveView();
});

// Clicking a slot label (class view) filters to that slot and toggles back.
els.bisList.addEventListener("click", (e) => {
  const btn = e.target.closest(".slot-label-link");
  if (!btn) return;
  const slotId = btn.dataset.slot;
  navigate({ view: "class", slotId: state.slotId === slotId ? "all" : slotId });
});

window.addEventListener("hashchange", applyRoute);

/* ---- Init ---- */
renderPhaseOptions();
renderSlotOptions();
if (!location.hash) {
  history.replaceState(
    null,
    "",
    buildHash({
      view: state.view,
      classId: state.classId,
      specId: state.specId,
      slotId: state.slotId,
    })
  );
}
applyRoute();
