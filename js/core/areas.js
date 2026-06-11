/** Classify a raw source string into a content area, used by the area filter. */
export function areaOf(source) {
  const s = (source || "").toLowerCase();
  if (/sunwell|kalecgos|brutallus|felmyst|eredar twins|m'uru|muru|kil'jaeden/.test(s))
    return "Sunwell Plateau";
  if (/black temple|naj'entus|supremus|akama|gorefiend|bloodboil|reliquary|illidari council|illidan/.test(s))
    return "Black Temple";
  if (/hyjal|winterchill|anetheron|kaz'rogal|azgalor|archimonde/.test(s))
    return "Mount Hyjal";
  if (/zul'aman|zul aman|akil'zon|halazzi|jan'alai|nalorakk|hex lord|zul'jin/.test(s))
    return "Zul'Aman";
  if (/ssc|vashj|hydross|lurker|leotheras|morogrim|fathom|tidewalker|karathress|serpentshrine/.test(s))
    return "Serpentshrine Cavern";
  if (/tempest keep|the eye|kael|void reaver|al'ar|alar|solarian|mechano/.test(s))
    return "Tempest Keep";
  if (/karazhan|attumen|moroes|maiden|opera|curator|aran|netherspite|nightbane|prince|chess/.test(s))
    return "Karazhan";
  if (/gruul|maulgar|high king/.test(s)) return "Gruul's Lair";
  if (/magtheridon|^mag\b|mag's/.test(s)) return "Magtheridon's Lair";
  if (/heroic/.test(s)) return "Heroic Dungeons";
  if (/craft|tailor|leatherwork|blacksmith|jewelcraft/.test(s)) return "Crafted";
  if (/badge|g'eras|geras/.test(s)) return "Badge of Justice";
  if (/darkmoon/.test(s)) return "Darkmoon Faire";
  if (/rep|cenarion|lower city|aldor|scryer|sha'tar|honor hold|thrallmar|consortium|keepers|revered|exalted/.test(s))
    return "Reputation";
  if (/pvp|arena|gladiator|honor/.test(s)) return "PvP";
  if (/boe|world|drop/.test(s)) return "World / BoE";
  return "Other";
}
