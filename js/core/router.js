/**
 * Hash-based routing (works with the static python http.server, and gives us
 * real browser back/forward).
 *
 *   #/items                  -> item reverse-lookup view
 *   #/<classId>              -> class view, all slots
 *   #/<classId>/<slotId>     -> class view, filtered to one slot
 */
export function buildHash({ view, classId, slotId }) {
  if (view === "item") return "#/items";
  if (slotId && slotId !== "all") return `#/${classId}/${slotId}`;
  return `#/${classId}`;
}

export function parseHash() {
  const parts = (location.hash || "")
    .replace(/^#\/?/, "")
    .split("/")
    .filter(Boolean)
    .map(decodeURIComponent);

  if (parts[0] === "items") {
    return { view: "item", classId: null, slotId: "all" };
  }
  return { view: "class", classId: parts[0] || null, slotId: parts[1] || "all" };
}
