# MWASALAT BRAND (additive — Mwasalat-prefixed files only)

Matches the real Mwasalat Oman identity (deep red road-network mark, black
wordmark, mwasalat.om) instead of the generic teal/coral placeholder theme.
`tealBrand` / `coral` in `tailwind.config.js` are the **original Eonix
theme** and are still used by Eonix's own pages — do not repaint them.

## Tokens (tailwind.config.js)

`mwasalatRed` — brand red, CTAs, highlights (real Mwasalat identity color):
- 700 `#7A1420` · 600 `#9C1B29` · 500 `#C22033` · 300 `#E8929C` · 100 `#FBE7E9`

`mwasalatInk` — structural near-black (echoes the wordmark), headers, text,
icons, dark bands:
- 500 `#23181A` · 400 `#4A3336` · 300 `#8C6B6E` · 200 `#D9C9CA` · 100 `#F6EFEF`

## Usage

- Use `mwasalatRed-*` / `mwasalatInk-*` Tailwind classes in any file under
  `pages/mwasalat/`, `components/mwasalat/`, `layouts/Mwasalat*.jsx`, or
  `utils/mwasalatCategoryTheme.js`.
- Never use `coral-*` / `tealBrand-*` in new Mwasalat code — those are Eonix's.
- The old placeholder Mwasalat theme (pre-rebrand) is archived at
  `frontend/src/styles/mwasalatThemeLegacy.reference.js` for reference only.
- The pre-redesign landing page is archived at
  `frontend/src/pages/mwasalat/MwasalatLandingPageLegacy.jsx` (not routed).
