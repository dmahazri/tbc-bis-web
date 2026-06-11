# Loon BiS — TBC Classic Best in Slot

A lightweight web app inspired by the **Loon BiS** WoW addon. Browse Burning
Crusade best-in-slot gear two ways:

- **By Class** — pick a **class**, **spec**, and **phase** to see the ranked
  gear list for every slot.
- **By Item** — a reverse lookup that lists every item and shows which
  classes / specs / slots it is BiS (or an alternate) for.

Both views share a top **search** box, a **slot** filter, and an **area**
filter. It's a pure static site — **no build step, no dependencies**.

## Features

- Two views with tabbed switching: **By Class** and **By Item**
- Class + spec selection with class colors and role/spec icons
- Phase selector (Pre-Raid + P1–P5) with raid-tier hints
- Slot filter and a top-center **search** box (filters by item or source)
- **Area filter** (Karazhan, SSC, Tempest Keep, Heroic Dungeons, Crafted,
  Reputation, PvP, …) classified automatically from each item's source
- Ranked options per slot with **BIS / ALT** tags, plus tank **Threat /
  Mitigation / Stamina** variants (`BIS Thrt`, `BIS Mit`, `BIS Stam`, and their
  `ALT` counterparts) shown as colour-coded badges
- Item view collapses multi-phase usage into compact `BIS 1>2, 4` labels
- Item names use WoW **quality colors** and show **Wowhead hover tooltips**
  (for entries with a real item id)
- **Hash-based routing** with shareable URLs and working back/forward
  (`#/warrior`, `#/warrior/head`, `#/items`)
- Data is **auto-generated** from the LoonBestInSlot addon (see below)
- Modern dark-mode UI

## Run it

Just open `index.html` in a browser. The app uses **ES modules**, so a local
server is required for the relative imports to load:

```powershell
# from the project folder
python -m http.server 8000
# then visit http://localhost:8000
```

Or use the VS Code **Live Server** extension.

## Routing

The app is driven by the URL hash, so views and filters are shareable:

| Hash                            | View                                      |
| ------------------------------- | ----------------------------------------- |
| `#/<classId>`                   | Class view, first spec, all slots         |
| `#/<classId>/<specId>`          | Class view, spec, all slots               |
| `#/<classId>/<specId>/<slotId>` | Class view, spec, filtered to one slot    |
| `#/items`                       | Item reverse-lookup view                  |

## Project structure

```
loon-bis-tbc/
├── index.html               # markup + layout, loads js/main.js as a module
├── staticwebapp.config.json # Azure Static Web Apps SPA fallback + mime types
├── css/styles.css           # WoW-themed dark styling
├── tools/
│   └── generate-data.mjs    # regenerates js/data/* from the LoonBestInSlot addon
└── js/
    ├── main.js              # entry point: routing, events, init
    ├── core/
    │   ├── dom.js           # cached DOM element references
    │   ├── state.js         # shared mutable app state
    │   ├── router.js        # buildHash() / parseHash() hash routing
    │   ├── areas.js         # areaOf() — classifies a source into an area
    │   ├── itemIndex.js     # reverse index used by the item view
    │   ├── tiers.js         # tier badge classes + display order helpers
    │   └── wowhead.js       # Wowhead link building + tooltip refresh
    ├── data/                # AUTO-GENERATED — do not edit by hand
    │   ├── index.js         # aggregates the per-class BiS into one BIS object
    │   ├── meta.js          # PHASES, SLOTS, CLASSES, and the it() helper
    │   ├── items.js         # centralized ITEMS database (by id) + ref() helper
    │   └── <class>.js       # per-class BiS lists (warrior, mage, …)
    └── views/
        ├── controls.js      # sidebar tabs, class list, and filter dropdowns
        ├── classView.js     # renders the "By Class" gear list
        └── itemView.js      # renders the "By Item" reverse lookup
```

## Editing / extending the BiS data

The `js/data/*` files are **auto-generated** and should not be edited by hand.
They are produced from the [**LoonBestInSlot**](https://www.curseforge.com/wow/addons/loon-best-in-slot)
addon's Lua database + per-spec guide files by
[`tools/generate-data.mjs`](tools/generate-data.mjs).

### Regenerate the data

```powershell
# uses the default addon path baked into the script
node tools/generate-data.mjs

# or point at a specific addon copy
node tools/generate-data.mjs "C:\path\to\Interface\AddOns\LoonBestInSlot"
```

The script:

- parses `DB/ItemSources.lua` for item names + sources, and `Guides/*.lua`
  for each spec's ranked lists,
- writes the central [`js/data/items.js`](js/data/items.js) database (keyed by
  numeric Wowhead item id), the per-class files, and
  [`js/data/meta.js`](js/data/meta.js) (phases, slots, classes/specs),
- prints a summary plus any warnings (missing guides, unknown slots, etc.).

### Data shape

Items live **once** in `items.js` keyed by their numeric id and are referenced
from the per-class files via the `ref()` helper. Each class file is shaped
`spec → phase → slot → [options]`:

```js
import { ref } from "./items.js";

export const warrior = {
  protection: {
    p0: {
      head: [
        ref(32083),                 // #1 BIS (default tier)
        ref(27408, "BIS Thrt"),     // threat-focused alternative
        ref(28350, "ALT Mit"),      // mitigation-focused alternative
      ],
      // …
    },
  },
};
```

- `ref(id, tier)` — `id` is the numeric Wowhead item id; `tier` is `"BIS"`
  (default) or `"ALT"`. Tank specs also use the role-tagged variants
  `BIS Thrt` / `BIS Mit` / `BIS Stam` and their `ALT` equivalents.
- Tier badge colours and display order are defined in
  [`js/core/tiers.js`](js/core/tiers.js): BIS (green), ALT (amber), with the
  tank modifiers Threat (red), Mitigation (purple), and Stamina (blue).
- The **area filter** is derived automatically from each item's `source`
  string (see `areaOf()` in [`js/core/areas.js`](js/core/areas.js)).

### Add a class or spec

Class/spec metadata, the guide-file mapping, and tier handling are driven by
the tables near the top of [`tools/generate-data.mjs`](tools/generate-data.mjs)
(`SPEC_META`, `GUIDE_ORDER`, `SLOT_MAP`). Update those and re-run the generator
rather than editing `js/data/meta.js` directly.

## Deployment

The repo includes [`staticwebapp.config.json`](staticwebapp.config.json) for
**Azure Static Web Apps**: it rewrites navigation to `index.html` and sets the
correct JavaScript/JSON mime types so ES modules load. Any static host works —
just serve the folder as-is.

> Item data is a community-sourced reference and may differ from your specific
> server/patch. Item ids are provided for many well-known items; always verify
> on [Wowhead](https://www.wowhead.com/tbc).
