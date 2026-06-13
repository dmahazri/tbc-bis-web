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
- Dedicated **Two Hand** slot so two-handed weapons aren't hidden behind
  one-handers in the Main Hand list
- **Cumulative phases** — selecting a phase also carries forward gear from
  earlier phases that is still best-in-slot, with the current phase's picks on
  top
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
    ├── data/
    │   ├── index.js         # aggregates per-class BiS + cumulative phase merge
    │   ├── meta.js          # PHASES, SLOTS, CLASSES, and the it() helper
    │   ├── items.js         # centralized ITEMS database (by id) + ref() helper
    │   └── <class>.js       # per-class BiS lists (warrior, mage, …)
    └── views/
        ├── controls.js      # sidebar tabs, class list, and filter dropdowns
        ├── classView.js     # renders the "By Class" gear list
        └── itemView.js      # renders the "By Item" reverse lookup
```

## Deployment

The repo includes [`staticwebapp.config.json`](staticwebapp.config.json) for
**Azure Static Web Apps**: it rewrites navigation to `index.html` and sets the
correct JavaScript/JSON mime types so ES modules load. Any static host works —
just serve the folder as-is.

> Item data is a community-sourced reference and may differ from your specific
> server/patch. Item ids are provided for many well-known items; always verify
> on [Wowhead](https://www.wowhead.com/tbc).
