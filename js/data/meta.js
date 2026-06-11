export const PHASES = [
  { id: "p1", name: "Phase 1", detail: "Karazhan • Gruul • Magtheridon" },
  { id: "p2", name: "Phase 2", detail: "Serpentshrine Cavern • Tempest Keep" },
  { id: "p3", name: "Phase 3", detail: "Mount Hyjal • Black Temple" },
  { id: "p4", name: "Phase 4", detail: "Zul'Aman" },
  { id: "p5", name: "Phase 5", detail: "Sunwell Plateau" },
];

export const SLOTS = [
  { id: "head", name: "Head" },
  { id: "neck", name: "Neck" },
  { id: "shoulders", name: "Shoulders" },
  { id: "back", name: "Back" },
  { id: "chest", name: "Chest" },
  { id: "wrist", name: "Wrist" },
  { id: "hands", name: "Hands" },
  { id: "waist", name: "Waist" },
  { id: "legs", name: "Legs" },
  { id: "feet", name: "Feet" },
  { id: "rings", name: "Rings" },
  { id: "trinkets", name: "Trinkets" },
  { id: "mainhand", name: "Main Hand" },
  { id: "offhand", name: "Off Hand" },
  { id: "ranged", name: "Ranged / Relic" },
];

export const CLASSES = [
  {
    id: "warrior",
    name: "Warrior",
    color: "#C69B6D",
    specs: [
      { id: "fury", name: "Fury (DPS)", role: "dps", icon: "ability_warrior_innerrage" },
      { id: "protection", name: "Protection (Tank)", role: "tank", icon: "ability_warrior_defensivestance" },
    ],
  },
  {
    id: "paladin",
    name: "Paladin",
    color: "#F48CBA",
    specs: [
      { id: "retribution", name: "Retribution (DPS)", role: "dps", icon: "spell_holy_auraoflight" },
      { id: "holy", name: "Holy (Healer)", role: "healer", icon: "spell_holy_holybolt" },
      { id: "protection", name: "Protection (Tank)", role: "tank", icon: "spell_holy_devotionaura" },
    ],
  },
  {
    id: "hunter",
    name: "Hunter",
    color: "#AAD372",
    specs: [{ id: "ranged", name: "BM / Marksman (DPS)", role: "dps", icon: "ability_hunter_bestialdiscipline" }],
  },
  {
    id: "rogue",
    name: "Rogue",
    color: "#FFF468",
    specs: [{ id: "combat", name: "Combat (DPS)", role: "dps", icon: "ability_backstab" }],
  },
  {
    id: "priest",
    name: "Priest",
    color: "#FFFFFF",
    specs: [
      { id: "shadow", name: "Shadow (DPS)", role: "dps", icon: "spell_shadow_shadowwordpain" },
      { id: "holy", name: "Holy / Disc (Healer)", role: "healer", icon: "spell_holy_powerwordshield" },
    ],
  },
  {
    id: "shaman",
    name: "Shaman",
    color: "#0070DD",
    specs: [
      { id: "enhancement", name: "Enhancement (DPS)", role: "dps", icon: "spell_nature_lightningshield" },
      { id: "elemental", name: "Elemental (DPS)", role: "dps", icon: "spell_nature_lightning" },
      { id: "restoration", name: "Restoration (Healer)", role: "healer", icon: "spell_nature_magicimmunity" },
    ],
  },
  {
    id: "mage",
    name: "Mage",
    color: "#3FC7EB",
    specs: [{ id: "arcane", name: "Arcane / Fire (DPS)", role: "dps", icon: "spell_holy_magicalsentry" }],
  },
  {
    id: "warlock",
    name: "Warlock",
    color: "#8788EE",
    specs: [{ id: "destruction", name: "Affliction / Destro (DPS)", role: "dps", icon: "spell_shadow_rainoffire" }],
  },
  {
    id: "druid",
    name: "Druid",
    color: "#FF7C0A",
    specs: [
      { id: "balance", name: "Balance (DPS)", role: "dps", icon: "spell_nature_starfall" },
      { id: "feral", name: "Feral (DPS)", role: "dps", icon: "ability_druid_catform" },
      { id: "feraltank", name: "Feral (Tank)", role: "tank", icon: "ability_racial_bearform" },
      { id: "restoration", name: "Restoration (Healer)", role: "healer", icon: "spell_nature_healingtouch" },
    ],
  },
];

/* compact item builder */
export function it(name, id, source, tier, quality) {
  return {
    name,
    id: id == null ? null : id,
    source: source || "",
    tier: tier || "BIS",
    quality: quality || "epic",
  };
}
