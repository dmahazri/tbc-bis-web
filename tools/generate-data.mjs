// Regenerates the app's data layer (js/data/*.js) from the LoonBestInSlot
// addon's Lua database + per-spec guide files.
//
// Usage:
//   node tools/generate-data.mjs ["<addon path>"]
//
// Default addon path points at the WoW Anniversary install. Pass a different
// path as the first CLI argument to regenerate from another copy of the addon.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const DATA_DIR = path.join(REPO_ROOT, "js", "data");

const ADDON_PATH =
  process.argv[2] ||
  "e:\\World of Warcraft\\_anniversary_\\Interface\\AddOns\\LoonBestInSlot";
const DB_FILE = path.join(ADDON_PATH, "DB", "ItemSources.lua");
const GUIDES_DIR = path.join(ADDON_PATH, "Guides");

const warnings = [];
const warn = (m) => warnings.push(m);

// ---------------------------------------------------------------------------
// Lua value helpers
// ---------------------------------------------------------------------------

/** Turn a Lua value expression into a plain JS string.
 *  Handles LBIS.L["x"], quoted literals, and ".." concatenation by extracting
 *  every string token in order (so literal "..." inside a string is safe). */
function luaStr(raw) {
  if (raw == null) return "";
  const TOKEN =
    /LBIS\.L\[\s*"((?:[^"\\]|\\.)*)"\s*\]|LBIS\.L\[\s*'((?:[^'\\]|\\.)*)'\s*\]|"((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)'/g;
  let out = "";
  let m;
  let matched = false;
  while ((m = TOKEN.exec(String(raw)))) {
    matched = true;
    out += m[1] ?? m[2] ?? m[3] ?? m[4] ?? "";
  }
  if (!matched) out = String(raw).trim();
  return out.replace(/\\"/g, '"').replace(/\\'/g, "'");
}

// ---------------------------------------------------------------------------
// Parse ItemSources.lua
// ---------------------------------------------------------------------------

const ITEM_RE =
  /\[(\d+)\]\s*=\s*\{\s*Name\s*=\s*(.+?),\s*SourceType\s*=\s*(.+?),\s*Source\s*=\s*(.+?),\s*SourceNumber\s*=\s*(.+?),\s*SourceLocation\s*=\s*(.+?),\s*SourceFaction\s*=\s*(.+?)\s*\}/;

function parseItemSources() {
  const text = fs.readFileSync(DB_FILE, "utf8");
  const sources = new Map();
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(ITEM_RE);
    if (!m) continue;
    const id = Number(m[1]);
    sources.set(id, {
      name: luaStr(m[2]),
      sourceType: luaStr(m[3]),
      source: luaStr(m[4]),
      sourceNumber: luaStr(m[5]),
      sourceLocation: luaStr(m[6]),
      sourceFaction: luaStr(m[7]),
    });
  }
  return sources;
}

/** Build a single readable source string from the structured fields. */
function readableSource(s) {
  if (!s) return "";
  const first = (v) => (v || "").split("~")[0].trim();
  const type = first(s.sourceType);
  const src = first(s.source);
  const loc = first(s.sourceLocation);

  let out = type || "";
  if (src) out += out ? ` — ${src}` : src;
  // SourceLocation is sometimes a bare recipe/spell id — only append text.
  if (loc && /[a-zA-Z]/.test(loc)) out += ` - ${loc}`;
  return out.trim();
}

// ---------------------------------------------------------------------------
// Parse guide files
// ---------------------------------------------------------------------------

const SLOT_MAP = {
  Head: "head",
  Shoulder: "shoulders",
  Back: "back",
  Chest: "chest",
  Wrist: "wrist",
  Hands: "hands",
  Waist: "waist",
  Legs: "legs",
  Feet: "feet",
  Neck: "neck",
  Ring: "rings",
  Trinket: "trinkets",
  "Main Hand": "mainhand",
  "Off Hand": "offhand",
  "Two Hand": "twohand",
  "Ranged/Relic": "ranged",
  "Main Hand~Off Hand": "mainhand",
};

const REGISTER_RE = /local\s+(\w+)\s*=\s*LBIS:RegisterSpec\(\s*(.+?)\s*,\s*(.+?)\s*,\s*"(\d+)"\s*\)/g;
const ADDITEM_RE = /LBIS:AddItem\(\s*(\w+)\s*,\s*"(\d*)"\s*,\s*(.+?)\s*,\s*"([^"]+)"\s*\)/g;

function slug(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

/** Normalise an addon tier label into a canonical tier token.
 *  The addon uses "BIS"/"Alt" plus tank role suffixes ("Thrt", "Mit", "Stam"),
 *  e.g. "BIS Thrt", "Alt Mit". We preserve the base rank and the role suffix
 *  so the tank Threat/Stamina/Mitigation variants survive into the app data. */
function normTier(raw) {
  const t = String(raw).trim().toLowerCase();
  const base = t.startsWith("bis") ? "BIS" : "ALT";
  if (/thrt|threat/.test(t)) return `${base} Thrt`;
  if (/mit/.test(t)) return `${base} Mit`;
  if (/stam|\bsta\b/.test(t)) return `${base} Stam`;
  return base;
}

/** Parse one guide file -> { class, spec, phases:{phaseId:{slotId:[{id,tier}]}} } */
function parseGuide(file) {
  const text = fs.readFileSync(file, "utf8");

  const specVars = {}; // varName -> phaseNumber
  let className = null;
  let specName = null;

  let m;
  REGISTER_RE.lastIndex = 0;
  while ((m = REGISTER_RE.exec(text))) {
    const [, varName, classRaw, specRaw, phase] = m;
    specVars[varName] = phase;
    className = className || luaStr(classRaw);
    specName = specName || luaStr(specRaw);
  }

  if (!className) {
    warn(`No RegisterSpec found in ${path.basename(file)}`);
    return null;
  }

  const phases = {};
  ADDITEM_RE.lastIndex = 0;
  while ((m = ADDITEM_RE.exec(text))) {
    const [, varName, idStr, slotRaw, tierRaw] = m;
    if (!idStr) continue;
    const phaseNum = specVars[varName];
    if (phaseNum == null) {
      warn(`AddItem references unknown spec var '${varName}' in ${path.basename(file)}`);
      continue;
    }
    const slotName = luaStr(slotRaw);
    const slotId = SLOT_MAP[slotName];
    if (!slotId) {
      warn(`Unknown slot '${slotName}' in ${path.basename(file)}`);
      continue;
    }
    const id = Number(idStr);
    const tier = normTier(tierRaw);
    const phaseId = `p${phaseNum}`;

    phases[phaseId] = phases[phaseId] || {};
    const arr = (phases[phaseId][slotId] = phases[phaseId][slotId] || []);
    if (!arr.some((e) => e.id === id)) arr.push({ id, tier });
  }

  return { className, specName, phases };
}

// ---------------------------------------------------------------------------
// Class / spec metadata (role, icon, colour)
// ---------------------------------------------------------------------------

const CLASS_COLOR = {
  warrior: "#C69B6D",
  paladin: "#F48CBA",
  hunter: "#AAD372",
  rogue: "#FFF468",
  priest: "#FFFFFF",
  shaman: "#0070DD",
  mage: "#3FC7EB",
  warlock: "#8788EE",
  druid: "#FF7C0A",
};

// keyed by `${classId}/${specId}` -> { name, role, icon }
const SPEC_META = {
  "warrior/arms": { name: "Arms (DPS)", role: "dps", icon: "ability_warrior_savageblow" },
  "warrior/fury": { name: "Fury (DPS)", role: "dps", icon: "ability_warrior_innerrage" },
  "warrior/protection": { name: "Protection (Tank)", role: "tank", icon: "ability_warrior_defensivestance" },

  "paladin/holy": { name: "Holy (Healer)", role: "healer", icon: "spell_holy_holybolt" },
  "paladin/protection": { name: "Protection (Tank)", role: "tank", icon: "spell_holy_devotionaura" },
  "paladin/retribution": { name: "Retribution (DPS)", role: "dps", icon: "spell_holy_auraoflight" },

  "hunter/beastmastery": { name: "Beast Mastery (DPS)", role: "dps", icon: "ability_hunter_bestialdiscipline" },
  "hunter/marksmanship": { name: "Marksmanship (DPS)", role: "dps", icon: "ability_marksmanship" },
  "hunter/survival": { name: "Survival (DPS)", role: "dps", icon: "ability_hunter_swiftstrike" },

  "rogue/dps": { name: "Combat (DPS)", role: "dps", icon: "ability_backstab" },

  "priest/holy": { name: "Holy / Disc (Healer)", role: "healer", icon: "spell_holy_powerwordshield" },
  "priest/shadow": { name: "Shadow (DPS)", role: "dps", icon: "spell_shadow_shadowwordpain" },

  "shaman/enhancement": { name: "Enhancement (DPS)", role: "dps", icon: "spell_nature_lightningshield" },
  "shaman/elemental": { name: "Elemental (DPS)", role: "dps", icon: "spell_nature_lightning" },
  "shaman/restoration": { name: "Restoration (Healer)", role: "healer", icon: "spell_nature_magicimmunity" },

  "mage/arcane": { name: "Arcane (DPS)", role: "dps", icon: "spell_holy_magicalsentry" },
  "mage/fire": { name: "Fire (DPS)", role: "dps", icon: "spell_fire_flamebolt" },
  "mage/frost": { name: "Frost (DPS)", role: "dps", icon: "spell_frost_frostbolt02" },

  "warlock/affliction": { name: "Affliction (DPS)", role: "dps", icon: "spell_shadow_deathcoil" },
  "warlock/demonology": { name: "Demonology (DPS)", role: "dps", icon: "spell_shadow_metamorphosis" },
  "warlock/destruction": { name: "Destruction (DPS)", role: "dps", icon: "spell_shadow_rainoffire" },

  "druid/balance": { name: "Balance (DPS)", role: "dps", icon: "spell_nature_starfall" },
  "druid/cat": { name: "Feral / Cat (DPS)", role: "dps", icon: "ability_druid_catform" },
  "druid/bear": { name: "Feral / Bear (Tank)", role: "tank", icon: "ability_racial_bearform" },
  "druid/restoration": { name: "Restoration (Healer)", role: "healer", icon: "spell_nature_healingtouch" },
};

// Guide files grouped in the order we want them to appear in the app.
const GUIDE_ORDER = [
  ["warrior", ["WarriorArms", "WarriorFury", "WarriorProtection"]],
  ["paladin", ["PaladinRetribution", "PaladinHoly", "PaladinProtection"]],
  ["hunter", ["HunterBeastMastery", "HunterMarksmanship", "HunterSurvival"]],
  ["rogue", ["RogueDps"]],
  ["priest", ["PriestShadow", "PriestHoly"]],
  ["shaman", ["ShamanEnhancement", "ShamanElemental", "ShamanRestoration"]],
  ["mage", ["MageArcane", "MageFire", "MageFrost"]],
  ["warlock", ["WarlockAffliction", "WarlockDemonology", "WarlockDestruction"]],
  ["druid", ["DruidBalance", "DruidCat", "DruidBear", "DruidRestoration"]],
];

const PHASES = [
  { id: "p0", name: "Pre-Raid", detail: "Dungeons • Heroics • Crafted" },
  { id: "p1", name: "Phase 1", detail: "Karazhan • Gruul • Magtheridon" },
  { id: "p2", name: "Phase 2", detail: "Serpentshrine Cavern • Tempest Keep" },
  { id: "p3", name: "Phase 3", detail: "Mount Hyjal • Black Temple" },
  { id: "p4", name: "Phase 4", detail: "Zul'Aman" },
  { id: "p5", name: "Phase 5", detail: "Sunwell Plateau" },
];

const PHASE_IDS = PHASES.map((p) => p.id);

const SLOTS = [
  { id: "head", name: "Head", icon: "inv_helmet_03" },
  { id: "neck", name: "Neck", icon: "inv_jewelry_necklace_07" },
  { id: "shoulders", name: "Shoulders", icon: "inv_shoulder_09" },
  { id: "back", name: "Back", icon: "inv_misc_cape_18" },
  { id: "chest", name: "Chest", icon: "inv_chest_chain" },
  { id: "wrist", name: "Wrist", icon: "inv_bracer_07" },
  { id: "hands", name: "Hands", icon: "inv_gauntlets_04" },
  { id: "waist", name: "Waist", icon: "inv_belt_07" },
  { id: "legs", name: "Legs", icon: "inv_pants_03" },
  { id: "feet", name: "Feet", icon: "inv_boots_chain_05" },
  { id: "rings", name: "Rings", icon: "inv_jewelry_ring_03" },
  { id: "trinkets", name: "Trinkets", icon: "inv_jewelry_talisman_05" },
  { id: "mainhand", name: "Main Hand", icon: "inv_sword_04" },
  { id: "offhand", name: "Off Hand", icon: "inv_shield_04" },
  { id: "twohand", name: "Two Hand", icon: "inv_sword_27" },
  { id: "ranged", name: "Ranged / Relic", icon: "inv_weapon_bow_07" },
];
const SLOT_IDS = SLOTS.map((s) => s.id);

// ---------------------------------------------------------------------------
// Code generation
// ---------------------------------------------------------------------------

function jsString(s) {
  return JSON.stringify(s == null ? "" : s);
}

function generate() {
  const sources = parseItemSources();
  console.log(`Parsed ${sources.size} item sources.`);

  const classes = []; // { id, name, color, specs:[{id,name,role,icon}] }
  const classData = {}; // classId -> { specId -> { phaseId -> { slotId -> [{id,tier}] } } }
  const usedItemIds = new Set();

  for (const [classId, files] of GUIDE_ORDER) {
    const specs = [];
    classData[classId] = {};

    for (const baseName of files) {
      const file = path.join(GUIDES_DIR, `${baseName}.lua`);
      if (!fs.existsSync(file)) {
        warn(`Missing guide file: ${baseName}.lua`);
        continue;
      }
      const guide = parseGuide(file);
      if (!guide) continue;

      const specId = slug(guide.specName);
      const metaKey = `${classId}/${specId}`;
      const meta = SPEC_META[metaKey];
      if (!meta) {
        warn(`No SPEC_META for ${metaKey} (class="${guide.className}" spec="${guide.specName}")`);
      }
      specs.push({
        id: specId,
        name: meta ? meta.name : `${guide.specName}`,
        role: meta ? meta.role : "dps",
        icon: meta ? meta.icon : "inv_misc_questionmark",
      });

      classData[classId][specId] = guide.phases;
      for (const phaseId of Object.keys(guide.phases)) {
        for (const slotId of Object.keys(guide.phases[phaseId])) {
          for (const e of guide.phases[phaseId][slotId]) usedItemIds.add(e.id);
        }
      }
    }

    classes.push({
      id: classId,
      name: classId.charAt(0).toUpperCase() + classId.slice(1),
      color: CLASS_COLOR[classId] || "#FFFFFF",
      specs,
    });
  }

  // ---- items.js ----
  const itemIds = [...usedItemIds].sort((a, b) => a - b);
  let missing = 0;
  const itemLines = itemIds.map((id) => {
    const src = sources.get(id);
    if (!src) {
      missing++;
      warn(`Item ${id} not found in ItemSources.lua`);
      return `  ${id}: { name: ${jsString(`Item ${id}`)}, id: ${id}, source: "", quality: "epic" },`;
    }
    return `  ${id}: { name: ${jsString(src.name)}, id: ${id}, source: ${jsString(
      readableSource(src)
    )}, quality: "epic" },`;
  });

  const itemsJs = `// AUTO-GENERATED by tools/generate-data.mjs — do not edit by hand.
// Source: LoonBestInSlot addon (DB/ItemSources.lua + Guides/*.lua).
//
// Item database keyed by Wowhead item id. Referenced from the per-class data
// files via ref(id, tier). Quality is not present in the addon DB, so every
// entry defaults to "epic".

export const ITEMS = {
${itemLines.join("\n")}
};

/** Resolve an item by id into the entry shape used by the views. */
export function ref(id, tier) {
  const base = ITEMS[id];
  if (!base) {
    console.warn("Unknown item id:", id);
    return { name: String(id), id: id ?? null, source: "", tier: tier || "BIS", quality: "epic" };
  }
  return {
    name: base.name,
    id: base.id == null ? null : base.id,
    source: base.source || "",
    tier: tier || "BIS",
    quality: base.quality || "epic",
  };
}
`;
  fs.writeFileSync(path.join(DATA_DIR, "items.js"), itemsJs);
  console.log(`Wrote items.js (${itemIds.length} items, ${missing} missing sources).`);

  // ---- meta.js ----
  const phasesJs = PHASES.map(
    (p) => `  { id: ${jsString(p.id)}, name: ${jsString(p.name)}, detail: ${jsString(p.detail)} },`
  ).join("\n");
  const slotsJs = SLOTS.map(
    (s) => `  { id: ${jsString(s.id)}, name: ${jsString(s.name)}, icon: ${jsString(s.icon)} },`
  ).join("\n");
  const classesJs = classes
    .map((c) => {
      const specsJs = c.specs
        .map(
          (s) =>
            `      { id: ${jsString(s.id)}, name: ${jsString(s.name)}, role: ${jsString(
              s.role
            )}, icon: ${jsString(s.icon)} },`
        )
        .join("\n");
      return `  {
    id: ${jsString(c.id)},
    name: ${jsString(c.name)},
    color: ${jsString(c.color)},
    specs: [
${specsJs}
    ],
  },`;
    })
    .join("\n");

  const metaJs = `// AUTO-GENERATED by tools/generate-data.mjs — do not edit by hand.
// Source: LoonBestInSlot addon.

export const PHASES = [
${phasesJs}
];

export const SLOTS = [
${slotsJs}
];

export const CLASSES = [
${classesJs}
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
`;
  fs.writeFileSync(path.join(DATA_DIR, "meta.js"), metaJs);
  console.log(`Wrote meta.js (${classes.length} classes).`);

  // ---- per-class files ----
  for (const cls of classes) {
    const specBlocks = cls.specs
      .map((spec) => {
        const phases = classData[cls.id][spec.id] || {};
        const phaseBlocks = PHASE_IDS.filter((pid) => phases[pid])
          .map((pid) => {
            const slots = phases[pid];
            const slotBlocks = SLOT_IDS.filter((sid) => slots[sid] && slots[sid].length)
              .map((sid) => {
                const refs = slots[sid]
                  .map((e) => `ref(${e.id}${e.tier === "BIS" ? "" : `, "${e.tier}"`})`)
                  .join(", ");
                return `        ${sid}: [${refs}],`;
              })
              .join("\n");
            return `      ${pid}: {\n${slotBlocks}\n      },`;
          })
          .join("\n");
        return `    ${spec.id}: {\n${phaseBlocks}\n    },`;
      })
      .join("\n");

    const fileJs = `// AUTO-GENERATED by tools/generate-data.mjs — do not edit by hand.
// Source: LoonBestInSlot addon guides.
import { ref } from "./items.js";

export const ${cls.id} = {
${specBlocks}
};
`;
    fs.writeFileSync(path.join(DATA_DIR, `${cls.id}.js`), fileJs);
  }
  console.log(`Wrote ${classes.length} per-class data files.`);

  // ---- summary ----
  console.log("\n=== Class / spec summary ===");
  for (const c of classes) {
    console.log(`${c.name}: ${c.specs.map((s) => `${s.id}(${s.role})`).join(", ")}`);
  }

  if (warnings.length) {
    console.log(`\n=== ${warnings.length} warning(s) ===`);
    for (const w of warnings.slice(0, 60)) console.log(" - " + w);
    if (warnings.length > 60) console.log(` ... and ${warnings.length - 60} more`);
  } else {
    console.log("\nNo warnings.");
  }
}

generate();
