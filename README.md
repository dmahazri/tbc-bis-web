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
- Phase selector (P1–P5) with raid-tier hints
- Slot filter and a top-center **search** box (filters by item or source)
- **Area filter** (Karazhan, SSC, Tempest Keep, Heroic Dungeons, Crafted,
  Reputation, PvP, …) classified automatically from each item's source
- Up to **4 ranked options per slot** with **BIS / ALT** tags
- Item view collapses multi-phase usage into compact `BIS 1>2, 4` labels
- Item names use WoW **quality colors** and show **Wowhead hover tooltips**
  (for entries with a real item id)
- **Hash-based routing** with shareable URLs and working back/forward
  (`#/warrior`, `#/warrior/head`, `#/items`)
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

| Hash                 | View                                    |
| -------------------- | --------------------------------------- |
| `#/<classId>`        | Class view, all slots                   |
| `#/<classId>/<slot>` | Class view, filtered to a single slot   |
| `#/items`            | Item reverse-lookup view                |

## Project structure

```
loon-bis-tbc/
├── index.html               # markup + layout, loads js/main.js as a module
├── staticwebapp.config.json # Azure Static Web Apps SPA fallback + mime types
├── css/styles.css           # WoW-themed dark styling
└── js/
    ├── main.js              # entry point: routing, events, init
    ├── core/
    │   ├── dom.js           # cached DOM element references
    │   ├── state.js         # shared mutable app state
    │   ├── router.js        # buildHash() / parseHash() hash routing
    │   ├── areas.js         # areaOf() — classifies a source into an area
    │   ├── itemIndex.js     # reverse index used by the item view
    │   └── wowhead.js       # Wowhead link building + tooltip refresh
    ├── data/
    │   ├── index.js         # aggregates the per-class BiS into one BIS object
    │   ├── meta.js          # PHASES, SLOTS, CLASSES, and the it() helper
    │   ├── items.js         # centralized ITEMS database + ref() helper
    │   └── <class>.js       # per-class BiS lists (warrior, mage, …)
    └── views/
        ├── controls.js      # sidebar tabs, class list, and filter dropdowns
        ├── classView.js     # renders the "By Class" gear list
        └── itemView.js      # renders the "By Item" reverse lookup
```

## Editing / extending the BiS data

Items are defined **once** in the central database in
[`js/data/items.js`](js/data/items.js) and **referenced** by key from the
per-class files. This keeps item metadata (id, source, quality) in a single
place.

### 1. Add or edit an item in the database

```js
// js/data/items.js — ITEMS map
export const ITEMS = {
  warbringer_battle_helm: {
    name: "Warbringer Battle-Helm",
    id: 29011,            // numeric Wowhead item id (enables tooltip) or null
    source: "Magtheridon's Lair",
    quality: "epic",      // "epic" (default) | "rare" | "uncommon" | "legendary"
  },
  // …
};
```

### 2. Reference items from a class file

Each class file (e.g. [`js/data/warrior.js`](js/data/warrior.js)) is shaped
`spec → phase → slot → [options]`, built with the `ref()` helper:

```js
import { ref } from "./items.js";

export const warrior = {
  fury: {
    p1: {
      head: [
        ref("warbringer_battle_helm"),   // #1 BIS (default tier)
        ref("felsteel_helm", "ALT"),     // #2 ALT
      ],
      // …
    },
  },
};
```

- `ref(key, tier)` — `key` is the `ITEMS` map key; `tier` is `"BIS"` (default)
  or `"ALT"`. Unknown keys log a console warning and render a fallback entry.
- `rings` and `trinkets` are single slots that list the top options together.
- Provide a real numeric `id` to get a rich Wowhead tooltip on hover; without
  one the link falls back to a Wowhead name search (no tooltip).
- The **area filter** is derived automatically from each item's `source`
  string (see `areaOf()` in [`js/core/areas.js`](js/core/areas.js)).

### 3. Add a class or spec

Classes, specs, slots, and phases are defined in
[`js/data/meta.js`](js/data/meta.js). Add a new class file under `js/data/`,
register it in [`js/data/index.js`](js/data/index.js), and add the matching
entry (with `specs` and colors) to `CLASSES` in `meta.js`.

## Deployment

The repo includes [`staticwebapp.config.json`](staticwebapp.config.json) for
**Azure Static Web Apps**: it rewrites navigation to `index.html` and sets the
correct JavaScript/JSON mime types so ES modules load. Any static host works —
just serve the folder as-is.

> Item data is a community-sourced reference and may differ from your specific
> server/patch. Item ids are provided for many well-known items; always verify
> on [Wowhead](https://www.wowhead.com/tbc).
