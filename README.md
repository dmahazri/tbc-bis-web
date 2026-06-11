# Loon BiS — TBC Classic Best in Slot

A lightweight web app inspired by the **Loon BiS** WoW addon. Pick a **class**,
**specialization**, **phase**, and optionally filter by **slot** to view a
Burning Crusade best-in-slot gear list.

## Features

- Class + spec selection with class colors
- Phase selector (P1–P5)
- Slot filter and a top-center **search** box (filters by item or source)
- **Area filter** (Karazhan, SSC, Tempest Keep, Heroics, Crafted, …) built
  dynamically from the items shown
- Up to **4 ranked options per slot** with **BIS / ALT** tags
- Item names use WoW **quality colors** and show **Wowhead hover tooltips**
  (for entries with a real item id)
- Modern dark-mode UI
- Pure static site — **no build step, no dependencies**

## Run it

Just open `index.html` in a browser. For correct relative paths, a tiny local
server is recommended:

```powershell
# from the project folder
python -m http.server 8000
# then visit http://localhost:8000
```

Or use the VS Code **Live Server** extension.

## Project structure

```
loon-bis-tbc/
├── index.html        # markup + layout
├── css/styles.css    # WoW-themed dark styling
└── js/
    ├── data.js       # CLASSES / SLOTS / PHASES / BIS database
    └── app.js        # filtering + rendering logic
```

## Editing / extending the BiS data

All gear lists live in [`js/data.js`](js/data.js). Each slot holds an ordered
list of up to 4 options built with the `it()` helper:

```js
it(name, id, source, tier, quality)
//   id      : numeric Wowhead item id (enables hover tooltip) or null
//   tier    : "BIS" (default) or "ALT"
//   quality : "epic" (default) | "rare" | "uncommon" | "legendary"

BIS[classId][specId][phaseId][slotId] = [
  it("Best item",  29011, "Magtheridon's Lair"),          // #1 BIS
  it("Alternate",  28223, "Blacksmithing", "ALT"),        // #2 ALT
];
```

- `rings` and `trinkets` are single slots that list the top options together.
- Provide a real numeric `id` to get a rich Wowhead tooltip on hover; without
  one the link falls back to a Wowhead name search (no tooltip).
- The **area filter** is derived automatically from each item's `source`
  string (see `areaOf()` in [`js/app.js`](js/app.js)).

> Item data is a community-sourced reference and may differ from your specific
> server/patch. Item ids are provided for many well-known items; always verify
> on [Wowhead](https://www.wowhead.com/tbc).
