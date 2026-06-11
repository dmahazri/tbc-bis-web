/** Classify a raw source string into a content area, used by the area filter.
 *
 * Sources produced by the data generator look like:
 *   "Drop — <boss> - <zone>"
 *   "Tier Token — <boss> - <raid>"
 *   "Profession — <profession>"
 *   "Reputation — <faction> - <standing>"
 *   "PvP — <currency> - <vendor>"
 * so we classify primarily by the source type prefix and the trailing zone. */
export function areaOf(source) {
  const s = (source || "").trim();
  if (!s) return "Other";

  const type = s.split(" — ")[0].split(" - ")[0].trim().toLowerCase();
  const li = s.lastIndexOf(" - ");
  const loc = (li >= 0 ? s.slice(li + 3) : "").trim().toLowerCase();

  // Source-type driven categories.
  if (type === "profession" || type === "transmute" || type === "conjured") return "Crafted";
  if (type === "pvp" || /pvp vendor|arena vendor/.test(loc)) return "PvP";
  if (type === "reputation" || /^(exalted|revered|honored|friendly|neutral)$/.test(loc))
    return "Reputation";
  if (type === "dungeon token" || /g'eras/.test(loc)) return "Badge of Justice";

  // Heroic five-mans (zone tagged "(H)" or "(Heroic)").
  if (/\(h\)|\(heroic\)/.test(loc)) return "Heroic Dungeons";

  const z = loc || s.toLowerCase();

  // TBC raids.
  if (/sunwell/.test(z)) return "Sunwell Plateau";
  if (/black temple/.test(z)) return "Black Temple";
  if (/hyjal/.test(z)) return "Mount Hyjal";
  if (/zul'aman|zul aman/.test(z)) return "Zul'Aman";
  if (/serpentshrine/.test(z)) return "Serpentshrine Cavern";
  if (/tempest keep|the eye/.test(z)) return "Tempest Keep";
  if (/karazhan/.test(z)) return "Karazhan";
  if (/gruul/.test(z)) return "Gruul's Lair";
  if (/magtheridon/.test(z)) return "Magtheridon's Lair";

  // Pre-TBC content.
  if (/molten core|blackwing lair|ahn'qiraj|zul'gurub|naxxramas|onyxia|world bosses|blackrock|stratholme|dire maul|scholomance|blasted lands/.test(z))
    return "Classic";

  // TBC five-man dungeons (normal).
  if (/underbog|shattered halls|mechanar|shadow labyrinth|botanica|steamvault|arcatraz|sethekk halls|black morass|auchenai crypts|blood furnace|hellfire ramparts|old hillsbrad|mana.?tombs|slave pens|magisters' terrace|caverns of time|auchindoun/.test(z))
    return "Dungeons";

  if (/darkmoon/.test(z)) return "Darkmoon Faire";
  if (/world drop|world boss|bind on equip|\bboe\b/.test(z)) return "World / BoE";
  if (type === "quest") return "Quest";
  if (type === "vendor") return "Vendor";

  return "Other";
}
