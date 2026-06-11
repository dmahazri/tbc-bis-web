/**
 * Hash-based routing (works with the static python http.server, and gives us
 * real browser back/forward).
 *
 *   #/items                       -> item reverse-lookup view
 *   #/<classId>                   -> class view, first spec, all slots
 *   #/<classId>/<specId>          -> class view, spec, all slots
 *   #/<classId>/<specId>/<slotId> -> class view, spec, filtered to one slot
 */
export function buildHash({ view, classId, specId, slotId }) {
  if (view === "item") return "#/items";
  let hash = `#/${classId}`;
  if (specId) hash += `/${specId}`;
  if (specId && slotId && slotId !== "all") hash += `/${slotId}`;
  return hash;
}

export function parseHash() {
  const parts = (location.hash || "")
    .replace(/^#\/?/, "")
    .split("/")
    .filter(Boolean)
    .map(decodeURIComponent);

  if (parts[0] === "items") {
    return { view: "item", classId: null, specId: null, slotId: "all" };
  }
  return {
    view: "class",
    classId: parts[0] || null,
    specId: parts[1] || null,
    slotId: parts[2] || "all",
  };
}
