/** Cache DOM references used across the app. Modules are deferred, so the
 * document is fully parsed before this runs. */
export const els = {
  viewTabs: document.getElementById("view-tabs"),
  classGroup: document.getElementById("class-group"),
  classList: document.getElementById("class-list"),
  phaseSelect: document.getElementById("phase-select"),
  slotSelect: document.getElementById("slot-select"),
  areaSelect: document.getElementById("area-select"),
  searchInput: document.getElementById("search-input"),
  resultHeader: document.getElementById("result-header"),
  bisList: document.getElementById("bis-list"),
};
