// Tier helpers shared by the class and item views.
//
// The LoonBestInSlot addon ranks gear as "BIS" or "Alt" and, for tank specs,
// splits those into Threat / Mitigation / Stamina variants ("BIS Thrt",
// "Alt Mit", ...). These helpers map a tier token to its CSS classes and give
// a stable display order.

/** Preferred display order for tier badges. */
export const TIER_ORDER = [
  "BIS",
  "BIS Thrt",
  "BIS Mit",
  "BIS Stam",
  "ALT",
  "ALT Thrt",
  "ALT Mit",
  "ALT Stam",
];

/** CSS classes for a tier badge: a base rank colour plus an optional
 *  tank-role modifier. */
export function tierBadgeClass(tier) {
  const t = String(tier || "");
  const base = t.startsWith("BIS") ? "tier-bis" : "tier-alt";
  let mod = "";
  if (/thrt/i.test(t)) mod = " tier-thrt";
  else if (/mit/i.test(t)) mod = " tier-mit";
  else if (/stam/i.test(t)) mod = " tier-stam";
  return base + mod;
}
