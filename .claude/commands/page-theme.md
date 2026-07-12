# Eonix UI Theme Guide

Apply the Eonix design system when building or reviewing any page or component.
Page or component to work on: **$ARGUMENTS**

---

## Personality

The UI must feel: **modern · clean · premium · structured · minimal · startup/SaaS**.

Never use: random Tailwind palette colors, heavy dark backgrounds, cluttered spacing, excessive color.

---

## Color Tokens

### Brand Teal (structure, branding, icons)
| Token | Value |
|-------|-------|
| 500 | `#1F5E63` |
| 400 | `#2F7A80` |
| 300 | `#5FA3A8` |
| 200 | `#A7D1D4` |
| 100 | `#E6F4F5` |

### Coral (CTAs and primary actions ONLY)
| Token | Value |
|-------|-------|
| 500 | `#C76D64` |
| 600 | `#A94E43` |
| light | `#F2B3AC` |
| bg | `#FDEFEE` |

### Backgrounds
| Use | Value |
|-----|-------|
| Page / main | `#F8F9FB` |
| Cards | `#FFFFFF` |
| Alternate sections | `#F8F9FB` |
| Teal tint section | `#E6F4F5` or `#F4FBFB` |

### Text
| Use | Value |
|-----|-------|
| Primary | `#1E293B` |
| Secondary | `#475569` |
| Muted | `#94A3B8` |

### Accents (use sparingly)
- Purple: `#7C6AF2` / bg `#F2EEFD`
- Orange: `#F59E0B` / bg `#FFFBEB`
- Green: `#22C55E` / bg `#E8F8F2`

### Color distribution rule
- 70 % neutral backgrounds and surfaces
- 20 % teal for structure and branding
- 10 % coral for actions and highlights

---

## Typography Scale

| Element | Classes |
|---------|---------|
| Hero heading | `text-4xl sm:text-5xl font-bold text-[#1E293B] leading-[1.2] tracking-tight` |
| Section heading | `text-4xl sm:text-5xl font-extrabold text-[#1E293B]` |
| Card title | `text-base font-bold text-[#1E293B]` |
| Section label (above heading) | `text-xs font-bold tracking-widest text-[#C76D64] uppercase mb-3` |
| Body / description | `text-base text-[#475569] leading-relaxed` |
| Small body / card desc | `text-sm text-[#475569] leading-relaxed` |
| Muted / meta | `text-xs text-[#94A3B8]` |

---

## Section Structure Pattern

Every section follows this skeleton:

```jsx
<section className="py-20 px-4 sm:px-6 lg:px-8 bg-white {or bg-[#F8F9FB]}">
  <div className="max-w-5xl mx-auto {or max-w-7xl}">

    {/* Header */}
    <div className="text-center mb-12">
      <p className="text-xs font-bold tracking-widest text-[#C76D64] uppercase mb-3">Section Label</p>
      <h2 className="text-4xl sm:text-5xl font-extrabold text-[#1E293B] mb-4">Section Heading</h2>
      <p className="text-[#475569] text-base max-w-md mx-auto">Supporting subtitle copy.</p>
    </div>

    {/* Content */}
  </div>
</section>
```

### Background alternation rule
Sections should alternate backgrounds so they visually separate:
- White (`bg-white`) → Alt (`bg-[#F8F9FB]`) → White → Alt …
- Teal tint (`bg-[#E6F4F5]` or `bg-[#F4FBFB]`) is used for special emphasis sections only.

---

## Cards

```jsx
{/* Standard card */}
<div
  className="bg-white rounded-2xl p-6 card-hover"
  style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}
>
```

```jsx
{/* Large / feature card */}
<div
  className="bg-white rounded-3xl p-8"
  style={{ boxShadow: '0 4px 30px rgba(0,0,0,0.08)' }}
>
```

- Always `rounded-2xl` or `rounded-3xl` — never `rounded-lg` or less
- Always soft shadows — never heavy `shadow-xl` directly
- Add `card-hover` class for hover lift animation (defined in `index.css`)

---

## Buttons

```jsx
{/* Primary CTA */}
<button className="inline-flex items-center gap-2 bg-[#CA6357] hover:bg-[#b85548] text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm">
  Action Label <Icon className="w-4 h-4" />
</button>

{/* Secondary / outline */}
<button className="inline-flex items-center gap-2 border-2 border-[#EEC8C6] text-[#C76D64] font-semibold px-6 py-3 rounded-xl hover:bg-[#FDEFEE] transition-colors text-sm">
  Secondary Action
</button>

{/* Ghost / subtle */}
<button className="inline-flex items-center gap-2 text-[#475569] hover:text-[#1E293B] font-medium text-sm transition-colors">
  Ghost Action
</button>
```

- Coral = primary action only. Never use coral for non-action elements.
- `rounded-xl` on buttons, `rounded-full` on pill badges only.

---

## Scroll Animations

Wrap sections in the page root with `data-reveal` for fade-up on scroll:

```jsx
<div data-reveal><MySection /></div>
```

Use `data-stagger` on grid containers to stagger children:

```jsx
<div data-stagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
  {items.map(...)}
</div>
```

These are driven by the `IntersectionObserver` in `LandingPage.jsx` and the CSS in `index.css`. The observer toggles the `revealed` class both ways (add on enter, remove on exit) so animations replay on scroll.

Existing animation classes in `index.css`:
| Class | Use |
|-------|-----|
| `card-hover` | Card lift on hover |
| `hero-fade-up` + `hero-d1…d5` | Hero entrance stagger |
| `hero-fade-in` | Hero image entrance |
| `btn-pulse` | Pulsing glow on primary CTA |
| `contact-jump` | Jump animation on scroll for icons |

---

## Icon Circles Pattern

Consistent icon presentation across sections:

```jsx
{/* Large icon circle */}
<div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ backgroundColor: iconBg }}>
  <Icon className="w-8 h-8" style={{ color: iconColor }} />
</div>

{/* Small icon circle */}
<div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: iconBg }}>
  <Icon className="w-4 h-4" style={{ color: iconColor }} />
</div>
```

Icon color pairs used across the site:
| Color | Bg |
|-------|----|
| `#1F5E63` | `#E6F4F5` |
| `#C76D64` | `#FDEFEE` |
| `#7C6AF2` | `#F2EEFD` |
| `#F59E0B` | `#FFFBEB` |
| `#22A66E` | `#E8F8F2` |
| `#0D9488` | `#E6F4F5` |

Never repeat the same color pair for two adjacent or visually grouped items.

---

## Decorative Vectors

For sections that feel visually empty, add a subtle SVG overlay:

```jsx
<section className="relative ...">
  <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
    {/* Dots */}
    <circle cx="5%" cy="20%" r="3" fill="#1F5E63" fillOpacity="0.12" />
    {/* Rings */}
    <circle cx="90%" cy="50%" r="28" fill="none" stroke="#1F5E63" strokeWidth="1.5" strokeOpacity="0.18" />
    {/* Dashed arc */}
    <path d="M 20,80 Q 60,40 30,160" fill="none" stroke="#1F5E63" strokeWidth="1.5" strokeOpacity="0.16" strokeDasharray="5 7" />
  </svg>

  {/* content */}
</section>
```

Rules:
- Keep opacities between 0.08–0.25 — visible but not distracting
- Use `#1F5E63` (teal) and `#C76D64` (coral) only
- Confine vectors to the outer 10–15 % of the section width — never overlap content

---

## Wave Transitions (between sections)

Use SVG waves to transition between a colored section and white:

```jsx
{/* White → teal: sits inside the teal section, top */}
<svg viewBox="0 0 1440 72" fill="none" className="w-full block -mb-px">
  <path d="M0,0 L0,28 C180,68 360,8 540,40 C720,72 900,12 1080,44 C1260,72 1380,24 1440,36 L1440,0 Z" fill="white" />
</svg>

{/* Teal → white: sits OUTSIDE the teal section, below it (inverted technique) */}
<svg viewBox="0 0 1440 72" fill="none" className="w-full block -mt-px">
  <path d="M0,0 L1440,0 L1440,44 C1380,24 1260,68 1080,40 C900,8 720,72 540,44 C360,12 180,72 0,36 Z" fill="#E6F4F5" />
</svg>
```

The closing wave must be placed **outside** the colored container to avoid subpixel border artifacts. Add `overflow-hidden` to the colored container.

---

## Spacing Rules

| Pattern | Value |
|---------|-------|
| Standard section vertical padding | `py-20` |
| Section with reduced top | `pt-10 pb-20` or `pt-12 pb-20` |
| Content max width (standard) | `max-w-5xl mx-auto` |
| Content max width (wide) | `max-w-7xl mx-auto` |
| Grid gap (cards) | `gap-6` |
| Card internal padding | `p-6` (standard) / `p-8 sm:p-10` (large) |
| Section header bottom margin | `mb-12` or `mb-14` |

---

## Checklist Before Finalising Any Page

- [ ] Backgrounds alternate (no two adjacent `bg-white` sections)
- [ ] All icon color pairs are unique within their visual group
- [ ] Coral used only for CTAs and highlights — not for decoration
- [ ] Cards use `rounded-2xl` or `rounded-3xl` and soft shadow
- [ ] Sections wrapped in `data-reveal` in the page root
- [ ] Grid containers use `data-stagger` for entrance animation
- [ ] No hardcoded numbers that aren't true (student counts, etc.)
- [ ] Mobile layout: text/headline appears before images
- [ ] Decorative vectors confined to edges, opacity ≤ 0.25
- [ ] Wave transitions use the inverted technique (closing wave outside container)
