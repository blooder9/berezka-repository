[README.md](https://github.com/user-attachments/files/34489957/README.md)
# Berezka Order Sorter

A Tampermonkey userscript for the Berezka WMS (`wms.berezka.cy`). It sorts the product list of an order, lets you mark products with colours that are remembered by article code, and restyles the whole site as a dark, mobile-friendly interface. It is built for a phone (Firefox for Android + Tampermonkey) and also works on a desktop browser.

> Unofficial tool. It is not affiliated with or endorsed by the operator of the WMS. It only changes how pages look and adds client-side helpers; it does not send any data anywhere.

## Features

**Order sorting**
- Sort the product table by number, code, name, required quantity or quantity on hand. Tap the same chip again to reverse the order.
- Sort by colour mark.
- Products sold by weight (kg, g) and by volume or bottle (l, ml, bottle, can) are highlighted automatically.

**Colour marks**
- Nine colours (orange, light blue, lime, purple, red, teal, blue, brown, white), applied at 30 % opacity.
- Tap the palette button, choose a colour, then tap products to paint them. Marks work on the order list and on the product card.
- Marks are stored per article code, so they stay on the product across orders and visits.
- Marks are kept in the userscript storage, in `localStorage` and optionally inside an exported copy of the script, so you can carry them to another device.

**Interface (dark graphite and gold theme)**
- Sticky top bar with sort chips, palette, refresh, theme switch and scroll-to-top buttons.
- Order page: title in the order shop, then order number, then type (dry, chilled, frozen).
- Order selection form with large inputs and chip buttons; terminal page with icon menu cards.
- Document lists as cards with status badges (`NEW` is shown only for the newest date) and search.
- Inventory, shipment and kitchen document lists as cards: coloured status, big action buttons, collapsible filter, search. Delete and rollback links ask for confirmation.
- File upload and "create document" forms as cards; the warning block with document errors is split into readable entries.
- Dashboard (`page=main`): tabs, shop and date selector, chart and rating cards, and a statistics table that scrolls inside its card with the shop name pinned.
- No horizontal page scrolling on mobile.

**Original site mode**
- The moon button reloads the page without any restyling, so the original site is untouched when you need it.

## Installation

1. Install [Tampermonkey](https://www.tampermonkey.net/) in your browser (Firefox for Android works).
2. Create a new userscript and paste the contents of `berezka-sort.user.js`, then save.
3. Open `https://wms.berezka.cy/` and reload the page.

After every new version, paste the script again over the old one. The header contains:

```
// @match        https://wms.berezka.cy/*
// @run-at       document-start
// @grant        GM_getValue
// @grant        GM_setValue
```

## Usage

| Control | Action |
| --- | --- |
| `№`, `Код`, `Название`, `Надо`, `Есть` chips | Sort the product list by that column |
| Colour chip | Sort by colour mark |
| Palette button | Open the colour palette and enter paint mode |
| Moon / sun button | Switch between the restyled and the original site |
| Refresh button | Reload the page without action parameters in the URL |
| Arrow button | Scroll to top |
| Export | Build a copy of the script with the current marks embedded, for another device |

## Project files

| File | Purpose |
| --- | --- |
| `berezka-sort.user.js` | The userscript (current version 3.12) |
| `bookmark-sorter.html` | Installation page with the script and a bookmarklet |
| `fx-*.html` | Page fixtures reconstructed from the real DOM, used for tests |
| `t*.py` | Playwright test scripts |

## Testing

The scripts are tested with Playwright (Chromium, Pixel 7 emulation) against local fixtures that mirror the real page structure. The checks cover:
- no horizontal overflow on every page type;
- sorting, marking and persistence of marks;
- the edit flow of a product card;
- the original-site mode leaves the DOM untouched.

Run a check, for example:

```
python3 t14.py r-invent r-ship r-kitchen r-main
```

The script has not been run against the live site in an automated way, so a visual check on a real phone is recommended after each update.

## Known limitations

- Mobile browsers may zoom the page when a text field gets focus (for example when editing a product). A safe fix is not available: forcing a viewport meta breaks fit-to-width in Firefox for Android.
- The statistics block (positions, required, weight, drinks, colour) under the shop name is not implemented yet.
- The layout depends on the current HTML of the WMS. If the site changes its markup, some pages may fall back to a plainer look; switch to the original mode with the moon button in that case.

## License

No license has been chosen yet. Add one before publishing the repository.
