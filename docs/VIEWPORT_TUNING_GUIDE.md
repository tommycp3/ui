# Viewport Tuning Guide

How to tune the poker table layout across all screen sizes.

**One file controls everything:** `src/config/stageGeometry.ts`
**CSS is dumb:** `Table.css` just anchors the wrapper at `left:50%; top:50%`. JS handles all positioning.

---

## 1. The Knobs

### Global Constants (affect ALL viewports)

| Knob | Line | Range | What it does |
|------|------|-------|-------------|
| `DEALER_DISTANCE` | ~160 | 0→1 | How far dealer button sits from seat toward table center. 0=at seat, 1=at center. |
| `CHIP_DISTANCE` | ~155 | 0→1 | How far chips sit from seat toward table center. |
| `TURN_ANIM_Y_OFFSET` | ~163 | px | How far down the turn animation ring sits below the player. |
| `CONTENT_WIDTH` | ~431 | px | Full seat-to-seat horizontal span + player UI. Used for mobile zoom calc. |
| `CONTENT_HEIGHT` | ~430 | px | Full seat-to-seat vertical span + player UI. Used for mobile zoom calc. |

### Per-Viewport Parameters (`VIEWPORT_PARAMS`)

Each viewport mode has four knobs:

| Knob | What it does | Direction |
|------|-------------|-----------|
| `maxScale` | Upper bound on zoom level. Lower = smaller table. | Lower ← safer for small screens |
| `paddingH` | Horizontal px reserved before fitting (split left/right). | Higher = narrower fit area |
| `paddingV` | Vertical px reserved before fitting. Account for header + footer here. | Higher = shorter fit area |
| `translateY` | % shift of the 850px wrapper. `-50%` = centered in parent. | Less negative = table moves DOWN. More negative = table moves UP. |

### Current Values

```
desktop:          maxScale=1.2  paddingH=200  paddingV=300  translateY="-50%"
tablet:           maxScale=0.8  paddingH=100  paddingV=200  translateY="-50%"
mobile-landscape: maxScale=0.38 paddingH=40   paddingV=120  translateY="-35%"
mobile-portrait:  maxScale=0.35 paddingH=20   paddingV=300  translateY="-30%"
```

### Per-Seat Fine-Tuning (when global knobs aren't enough)

| Knob | When to use |
|------|-------------|
| `GLOBAL_OFFSETS` | Nudge one seat's element on ALL screen sizes |
| `VIEWPORT_OFFSETS` | Nudge one seat's element on ONE specific screen size |

---

## 2. QA Order

**Get each viewport right before moving to the next.** Each builds on the last.

### Viewport order:
```
1. Desktop 1920×1080     ← baseline, most room, least constrained
2. Desktop 1440×900      ← common laptop
3. Tablet  1024×768      ← iPad landscape
4. Tablet  768×1024      ← iPad portrait
5. Mobile landscape 844×390  ← iPhone 12 Pro landscape (tightest vertical)
6. Mobile portrait  390×844  ← iPhone 12 Pro portrait (tightest horizontal)
```

### Table size order (for each viewport):
```
1. 9-seat  ← most seats, tightest fit — if this works, smaller tables usually do too
2. 6-seat  ← verify no weird gaps from missing seats
3. 2-seat  ← heads-up, verify centering looks good
```

### For each combination, check:
- [ ] All seats visible (none clipped by viewport edges)
- [ ] Table oval fully visible
- [ ] Dealer button ON the table surface for all seats
- [ ] Chips visible between seat and table center
- [ ] Community cards visible and centered
- [ ] Pot display readable
- [ ] No overlap between adjacent seats
- [ ] Footer/action panel doesn't cover seats

---

## 3. Troubleshooting

| Problem | Likely Cause | Fix |
|---------|-------------|-----|
| **Table too big for screen** | `maxScale` too high | Lower `maxScale` for that viewport |
| **Top seats clipped** | `translateY` too negative (pushing table UP) | Use less negative value (e.g., `-35%` → `-30%`) |
| **Bottom seats clipped** | `translateY` not negative enough | Use more negative value (e.g., `-35%` → `-40%`) |
| **Left/right seats clipped** | Viewport too narrow for content | Increase `CONTENT_WIDTH` or lower `maxScale` |
| **Table too small** | `maxScale` or `paddingV/H` too aggressive | Increase `maxScale` or reduce padding |
| **Dealer button off table** | `DEALER_DISTANCE` too low | Increase toward 0.5 |
| **Chips in wrong spot** | `CHIP_DISTANCE` wrong | Adjust (0.4 is default) |
| **One seat wrong, others fine** | Needs per-seat nudge | Use `VIEWPORT_OFFSETS` (see section 5) |
| **Changes not showing** | Vite cache | Hard refresh (Ctrl+Shift+R) or restart `yarn dev` |

---

## 4. How the System Works

```
┌─────────────────────────────────────────────────────────┐
│                    STAGE (1600×850)                      │
│                                                         │
│    Seat 5 ●─────────────────────● Seat 6                │
│           │                     │                       │
│  Seat 4 ● │  ┌───────────────┐ │ ● Seat 7              │
│           │  │ TABLE (900×450)│ │                       │
│  Seat 3 ● │  │   ┌─────────┐ │ │ ● Seat 8              │
│           │  │   │ Pot/Cards│ │ │                       │
│           │  └───────────────┘ │                        │
│    Seat 2 ●─────────● ─────────● Seat 9                │
│                   Seat 1                                │
└─────────────────────────────────────────────────────────┘

CSS anchor: left:50%, top:50% → puts wrapper top-left at parent center
JS transform: translate(-50%, translateY%) scale(zoom)
  │
  ├── translateX(-50%) → centers horizontally (always)
  ├── translateY(%)    → vertical positioning (per viewport)
  └── scale(zoom)      → calculated from available space ÷ content bounds
```

### The CSS + JS Centering Pattern (step by step)

```
Step 1: CSS sets  position:absolute; left:50%; top:50%
        → puts the wrapper's TOP-LEFT CORNER at parent's center

        Parent div
        ┌───────────────────────────┐
        │                           │
        │             ┌─────────────┤  ← wrapper starts here
        │             │  WRAPPER    │     (top-left corner at 50%/50%)
        │             │  1600×850   │
        └─────────────┴─────────────┘
                      ^ parent center


Step 2: JS adds  transform: translate(-50%, -50%)
        → shifts wrapper LEFT by 50% of its own width  (800px)
        → shifts wrapper UP by 50% of its own height   (425px)
        → now the wrapper's CENTER is at the parent's center

        Parent div
        ┌───────────────────────────┐
        │      ┌───────────┐       │
        │      │  WRAPPER   │       │  ← centered!
        │      │     ×      │       │     × = both centers align
        │      │  1600×850  │       │
        │      └───────────┘       │
        └───────────────────────────┘


Step 3: JS adds  scale(0.38)
        → shrinks wrapper from its center point
        → everything stays centered, just smaller

        Parent div
        ┌───────────────────────────┐
        │                           │
        │        ┌───────┐          │
        │        │ 608×  │          │  ← 1600×0.38 = 608px
        │        │  323  │          │     850×0.38  = 323px
        │        └───────┘          │
        │                           │
        └───────────────────────────┘


Step 4: translateY is NOT always -50%
        On mobile, the footer overlays the bottom of the page.
        So -50% centers in the FULL parent, but the VISIBLE area
        is smaller. We use -35% or -30% to push the table DOWN
        into the visible play area above the footer.

        ┌───────────────────────────┐
        │  Header (40px)            │
        │  ┌───────────────────┐    │
        │  │                   │    │  ← visible play area
        │  │    ┌───────┐      │    │
        │  │    │ TABLE │      │    │     table centered HERE
        │  │    └───────┘      │    │     not in the full page
        │  │                   │    │
        │  └───────────────────┘    │
        │  Footer (80px fixed)      │
        └───────────────────────────┘

        -50% = centered in full parent (top gets clipped)
        -35% = centered in visible area (what we want)
```

### The Zoom Calculation

```
availableWidth  = viewport.width  - paddingH
availableHeight = viewport.height - paddingV

On mobile:
  scaleByWidth  = availableWidth  / CONTENT_WIDTH  (1168px — full seat span)
  scaleByHeight = availableHeight / CONTENT_HEIGHT (650px  — full seat span)

On desktop/tablet:
  scaleByWidth  = availableWidth  / TABLE_WIDTH    (900px — just the table)
  scaleByHeight = availableHeight / TABLE_HEIGHT   (450px — just the table)

zoom = min(scaleByWidth, scaleByHeight, maxScale)
```

### Why `translateY` Varies Per Viewport

The CSS `top: 50%` positions relative to the **parent div**, not the viewport. The parent div's height depends on the flex layout (header, body, footer). On mobile, the footer (80px fixed) overlays the bottom, making the effective play area smaller than the parent. So `-50%` doesn't truly center in the visible area — we need `-35%` or `-30%` to push the table down into the visible play zone.

---

## 5. How to Add a Per-Seat Tweak

**Example:** "Seat 7 dealer button is 10px too far right on mobile landscape"

Open `src/config/stageGeometry.ts`, find `VIEWPORT_OFFSETS`, add:

```typescript
const VIEWPORT_OFFSETS: Partial<Record<ViewportMode, typeof GLOBAL_OFFSETS>> = {
    "mobile-landscape": {
        9: {
            dealers: {
                6: { dx: -10 }   // seat index 6 = seat 7 (0-indexed), 10px left
            }
        }
    }
};
```

**Offset directions:**
- `dx` positive = right, negative = left
- `dy` positive = down, negative = up

**Element types you can offset:**
- `players` — seat positions
- `vacantPlayers` — empty seat positions
- `chips` — chip stack positions (note: dy is inverted since chips use `bottom`)
- `dealers` — dealer button positions
- `turnAnimations` — turn indicator ring
- `winAnimations` — winner animation ring

---

## 6. Viewport Detection Breakpoints

```typescript
width ≤ 414 && portrait  → "mobile-portrait"
width ≤ 926 && landscape → "mobile-landscape"
width ≤ 1024             → "tablet"
else                     → "desktop"
```

**To check which mode you're in:** Open browser console and run:
```javascript
// This logs the current viewport mode
console.log(window.innerWidth, window.innerHeight,
  window.innerWidth > window.innerHeight ? 'landscape' : 'portrait');
```

---

## 7. Key Files

| File | What it controls |
|------|-----------------|
| `src/config/stageGeometry.ts` | ALL geometry: seat coords, zoom calc, transforms, offsets |
| `src/hooks/game/useTableLayout.ts` | React hook that calls stageGeometry on resize |
| `src/components/playPage/Table.css` | CSS anchor only (top:50%, left:50%) |
| `src/components/playPage/Table.tsx` | Applies `tableLayout.tableTransform` to wrapper div |
| `src/components/playPage/Table/components/PlayerSeating.tsx` | Renders players at positions, passes dealer positions |
| `src/components/playPage/Players/Player.tsx` | Current user's seat + dealer button |
| `src/components/playPage/Players/OppositePlayer.tsx` | Other players + dealer button |
| `src/components/playPage/Players/VacantPlayer.tsx` | Empty seats + dealer button |
