/** Build a Wowhead link for an item entry. Entries with a numeric id get a
 * direct item link (rich hover tooltip); others fall back to a name search. */
export function wowheadLink(entry) {
  if (entry.id) return `https://www.wowhead.com/tbc/item=${entry.id}`;
  const q = encodeURIComponent(entry.name);
  return `https://www.wowhead.com/tbc/items?filter=cr=55;crs=1;crv=${q}`;
}

/** Re-scan the DOM so Wowhead renders tooltips on freshly inserted links. */
export function refreshTooltips() {
  if (window.$WowheadPower && window.$WowheadPower.refreshLinks) {
    window.$WowheadPower.refreshLinks();
  }
}
