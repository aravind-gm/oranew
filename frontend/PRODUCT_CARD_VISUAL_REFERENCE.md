# ORA Product Card — Visual Design Reference

**Quick Visual Guide for Designers & Developers**

---

## 🎯 Card Overview

```
DESKTOP (1920px+)              TABLET (768px)              MOBILE (375px)
┌──────────────────┐          ┌─────────────┐             ┌────────────┐
│ Image (300px)    │          │ Image       │             │ Image      │
│ 3:4 ratio        │          │ (250px)     │             │ (200px)    │
│                  │          │             │             │            │
│  [B]     [♥]     │          │ [B]  [♥]    │             │ [B]   [♥]  │
│                  │          │             │             │   QA Btn   │
│  [Quick Add ↓]   │          │ [Quick Add] │             │ (visible)  │
└──────────────────┘          └─────────────┘             └────────────┘
    Name (2 lines)                Name                        Name
    ★★★★★ (23)                    ★★★★★                      Price
    ₹2,999 ~₹4,999~               ₹2,999 ~₹4,999~            Save ₹2k
    Save ₹2,000
```

---

## 🎨 Color Reference

### Primary Palette
```
BLUSH PINK          CHAMPAGNE GOLD      CHARCOAL            WARM IVORY
#FFD6E8             #D4AF77             #2D2D2D             #FDFBF7
████████            ████████            ████████            ████████

Used for:           Used for:           Used for:           Used for:
- Highlights        - Accents           - Primary text      - Background
- Hover states      - Star ratings      - Buttons           - Base
- Badges            - Savings text      - Price             - Spaces
```

### Functional Colors
```
WHITE               LIGHT GRAY          MEDIUM GRAY         SUCCESS
#FFFFFF             #E8E8E8             #6B6B6B             #A8D5BA
████████            ████████            ████████            ████████

Card background     Border/dividers     Secondary text      Success states
```

---

## 📐 Typography Hierarchy

### Product Name
```
Font:       Cormorant Garamond (Serif)
Size:       16px (desktop), 14px (tablet), 12px (mobile)
Weight:     500 (Medium)
Color:      #2D2D2D (Charcoal)
Hover:      #D4AF77 (Gold) + transition 300ms
Max lines:  2 (text-clamp)
Line height: 1.4

Example: "Delicate Gold Necklace with Pearl Pendant"
```

### Price
```
Font:       Cormorant Garamond (Serif)
Size:       18px (desktop), 16px (tablet), 14px (mobile)
Weight:     600 (Semibold)
Color:      #2D2D2D (Charcoal)

Example: "₹2,999"
```

### Original Price (Strikethrough)
```
Font:       Cormorant Garamond (Serif)
Size:       14px (smaller than current price)
Weight:     400 (Regular)
Color:      #A0A0A0 (Muted)
Decoration: line-through

Example: "~~₹4,999~~"
```

### Badge/Pill Text
```
Font:       Inter (Sans)
Size:       10px
Weight:     600 (Semibold)
Color:      #2D2D2D (Charcoal)
Transform:  UPPERCASE
Spacing:    Letter-spacing 0.15em
Padding:    8px 12px

Examples:
- "New In"
- "Bestseller"
- "20% Off"
```

### Button Text
```
Font:       Inter (Sans)
Size:       12px
Weight:     600 (Semibold)
Color:      #FFFFFF (White on dark button)
Transform:  UPPERCASE
Spacing:    Letter-spacing 0.15em
Padding:    12px 24px

Examples:
- "Add to Bag"
- "Adding..."
- "Added to Bag"
```

---

## 🔲 Component Dimensions

### Image Container
```
Aspect Ratio:       3:4 (portrait orientation)
Width:              100% of card
Height:             300px (desktop)
                    250px (tablet)
                    200px (mobile)

Sizing on different grids:
- 4-column grid (1920px):  440px wide × 586px tall
- 3-column grid (1440px):  380px wide × 507px tall
- 2-column grid (768px):   380px wide × 507px tall
- 1-column grid (375px):   165px wide × 220px tall
```

### Card Container
```
Border radius:      8px (rounded-luxury)
Shadow (default):   0 4px 20px rgba(0, 0, 0, 0.04)
Shadow (hover):     0 8px 30px rgba(0, 0, 0, 0.08)
Padding:            0 (image full-bleed)
Info section:       16px padding
Gap between info:   8px
```

### Badges
```
Background:         Semi-transparent white / gold
Padding:            8px 12px
Border radius:      16px (rounded-full)
Width:              Auto (min 60px)
Height:             32px

"New In":           White background (#FFFFFF/90)
"Bestseller":       Blush pink (#FFD6E8/90)
"X% Off":           Gold (#D4AF77/90)
```

### Wishlist Button
```
Type:               Floating button (top-right)
Size:               40px × 40px
Border radius:      50% (rounded-full)
Background:         White with backdrop blur
Icon:               Heart (18px)
Spacing from edge:  12px top, 12px right
Z-index:            10 (always on top)
```

### Quick Add Button
```
Type:               Full-width button at bottom of image
Width:              100% - 32px padding
Height:             44px (44 minimum touch target)
Padding:            12px 24px
Border radius:      16px (rounded-full)
Background:         Charcoal (#2D2D2D/95) with backdrop blur
Text color:         White
Icon size:          14px
Spacing:            16px from edges
```

---

## ✨ Animation Specifications

### Card Lift on Hover
```
Trigger:            Mouse enter on card
Property:           transform: translateY()
From:               translateY(0)
To:                 translateY(-4px)
Duration:           300ms
Easing:             ease-out
GPU:                ✅ Hardware accelerated
```

### Image Zoom
```
Trigger:            Card hover + second image exists
Property:           transform: scale()
From:               scale(1)
To:                 scale(1.05)
Duration:           700ms
Easing:             ease-out
GPU:                ✅ Hardware accelerated
```

### Shadow Increase
```
Trigger:            Card hover
Property:           box-shadow
From:               0 4px 20px rgba(0,0,0,0.04)
To:                 0 8px 30px rgba(0,0,0,0.08)
Duration:           300ms
Easing:             ease-out
GPU:                ✅ Hardware accelerated
```

### Wishlist Heart Animation
```
Trigger:            Click wishlist button
Properties:         scale + rotate
Scale:              [1, 1.4, 1]
Rotate:             [0°, ±15°, 0°] (depends on state)
Duration:           400ms
Easing:             ease-out
Follows with:       Color change (gray → gold)
GPU:                ✅ Hardware accelerated
```

### Quick Add Button Reveal
```
Trigger:            Card hover (desktop), always visible (mobile)
Property:           opacity + transform
From:               opacity 0, translateY(20px)
To:                 opacity 1, translateY(0)
Duration:           250ms
Easing:             ease-out
GPU:                ✅ Hardware accelerated
```

### Add to Bag Success Animation
```
Sequence:
1. Button shows loading spinner (rotating) — immediate
2. Text changes "Adding..." — immediate
3. After success, spinner replaced with checkmark — 600ms
4. Background color changes to green (#A8D5BA) — 200ms
5. Text changes "Added to Bag" — immediate
6. Auto-revert after 2 seconds — 300ms ease-out
GPU:                ✅ Hardware accelerated
```

### Image Crossfade (Hover Swap)
```
Trigger:            Card hover + second image available
Primary image:      opacity 1 → 0, scale 1 → 1.02
Hover image:        opacity 0 → 1, scale 1.02 → 1
Duration:           700ms
Easing:             ease-out
Simultaneous:       Both images animate at same time
GPU:                ✅ Hardware accelerated
```

---

## 🎯 Hover States Breakdown

### Card Container Hover (Desktop Only)
```
Before:                         After:
┌─────────────┐                ┌─────────────┐
│ Image       │                │ Image       │
│ 1px shadow  │   300ms →      │ 2px lift    │
│             │    ease-out     │ deeper shadow│
│ Info        │                │ Info        │
└─────────────┘                └─────────────┘

Transform:  y: 0 → -4px
Shadow:     light → deeper (increase 2x)
Duration:   300ms
```

### Wishlist Button Hover
```
State 1 (not wishlisted):      State 2 (wishlisted):
┌───────┐                      ┌───────┐
│ ♡ (gray) │                    │ ♥ (gold) │
│ scale 1  │   ↓ click         │ scale 1.1│
│ normal   │   animate          │ wiggle   │
└───────┘                      └───────┘

Scale:      1 → 1.1
Color:      #A0A0A0 → #D4AF77
Fill:       outline → solid
Duration:   400ms
```

### Quick Add Button Hover
```
Default:                       Hover:
┌────────────────────┐        ┌────────────────────┐
│ 🛍 Add to Bag      │        │ 🛍 Add to Bag      │
│ Charcoal bg        │   →    │ Charcoal bg        │
│ Normal shadow      │        │ Gold glow shadow   │
└────────────────────┘        └────────────────────┘

Background:  no change (subtle is better)
Shadow:      add gold glow (0 8px 20px rgba(212,175,119,0.15))
Duration:    300ms
No scale:    ✅ Apple-level subtlety (no jumping)
```

---

## 📱 Responsive Breakpoints

### Mobile (< 640px)
```
Card width:         Full - margins
Image height:       200px
Image aspect:       3:4
Typography:         12px (name), 14px (price)
Badges:             Visible
Wishlist:           Visible (floating)
Quick add:          Always visible (no hover needed)
Spacing:            12px gaps
```

### Tablet (640px - 1024px)
```
Card width:         ~23% in 4-col grid
Image height:       250px
Image aspect:       3:4
Typography:         14px (name), 16px (price)
Badges:             Visible
Wishlist:           Visible
Quick add:          Visible (always, smaller)
Spacing:            16px gaps
Card lift:          Smaller (2px instead of 4px)
```

### Desktop (1024px - 1920px)
```
Card width:         ~23% in 4-col grid
Image height:       300px
Image aspect:       3:4
Typography:         16px (name), 18px (price)
Badges:             Visible
Wishlist:           Floating (hover-state)
Quick add:          Hover-reveal
Spacing:            24px gaps
Card lift:          Full (4px)
```

### Ultra-Wide (> 1920px)
```
Same as Desktop (max 4-col grid recommended)
Container max-width: 7xl (80rem)
Maintain consistent card widths
```

---

## 🎨 Badge Styles

### New In Badge
```
Background:     White with opacity (#FFFFFF/95) + backdrop blur
Text:           Charcoal (#2D2D2D)
Size:           10px, UPPERCASE
Padding:        8px 12px
Radius:         16px (pill)
Border:         Light gray (#E8E8E8/50)
Shadow:         Subtle (0 2px 8px rgba(0,0,0,0.04))

Display rule:   New products (first 30 days)
Position:       Top-left, 12px spacing
```

### Bestseller Badge
```
Background:     Blush pink (#FFD6E8/95) + backdrop blur
Text:           Charcoal (#2D2D2D)
Size:           10px, UPPERCASE
Padding:        8px 12px
Radius:         16px (pill)
Shadow:         Same as "New In"

Display rule:   Top 10% by sales volume
Position:       Top-left, below "New In" if both present
```

### Discount Badge
```
Background:     Champagne gold (#D4AF77/90) + backdrop blur
Text:           Charcoal (#2D2D2D)
Size:           10px, UPPERCASE, font-weight 600
Padding:        8px 12px
Radius:         16px (pill)
Shadow:         Same as others

Content:        Calculated percentage (e.g., "20% Off")
Display rule:   When discountPercent > 0
Position:       Top-left, below other badges
```

### Stacking Rules
```
Max 3 badges (all three rarely show together)
Stack order (top to bottom):
  1. "New In"
  2. "Bestseller"
  3. "X% Off"
Gap between:    8px (vertical)
Left padding:   12px (from card edge)
```

---

## 📊 Card States

### Default State
```
┌─────────────────────────┐
│ Image (loaded)          │
│                         │
│ [New In]  [♡]          │
│                         │
├─────────────────────────┤
│ Product Name            │ ← #2D2D2D, 16px, serif
│ ★★★★★ (23 reviews)     │ ← Gold stars
│ ₹2,999 ~~₹4,999~~      │ ← Current, strikethrough
│ Save ₹2,000             │ ← Gold accent
└─────────────────────────┘

Appearance:  Neutral, inviting
Shadow:      Light (0 4px 20px rgba(0,0,0,0.04))
Cursor:      pointer (link)
```

### Hover State (Desktop)
```
┌─────────────────────────┐
│ Image (zoomed 1.05)     │ ← Smooth zoom
│                         │
│ [New In]  [♡ enlarged] │ ← Floating button enhanced
│                         │
│ [🛍 Add to Bag ↑]       │ ← Fade-in bottom button
├─────────────────────────┤
│ Product Name [GOLD]     │ ← Color change
│ ★★★★★ (23 reviews)     │
│ ₹2,999 ~~₹4,999~~      │
│ Save ₹2,000             │
└─────────────────────────┘

Appearance:  Elevated, interactive
Shadow:      Deep (0 8px 30px rgba(0,0,0,0.08))
Transform:   Lifted (-4px)
Changes:     Image zoom, button appear
```

### Loading State (Add to Bag)
```
┌──────────────────────────┐
│ ...                      │
├──────────────────────────┤
│ ...                      │
│ [⟳ Adding... →]          │ ← Spinner, disabled
└──────────────────────────┘

Button:     Opacity 0.5 (disabled appearance)
Spinner:    Rotating 360° continuously
Text:       "Adding..." (smaller, muted)
```

### Success State (Add to Bag)
```
┌──────────────────────────┐
│ ...                      │
├──────────────────────────┤
│ ...                      │
│ [✓ Added to Bag]         │ ← Green bg, checkmark
└──────────────────────────┘

Background:  Success green (#A8D5BA)
Icon:        Checkmark (white)
Text:        "Added to Bag" (white)
Duration:    2 seconds then revert to normal
```

### Wishlisted State
```
Before Click:               After Click:
[♡ gray outline]        →   [♥ gold filled]
Heart scale:  1                Heart scale: 1
Opacity:  normal              Opacity:  solid color
Color:    muted gray          Color:    gold (#D4AF77)

Animation:  Scale [1,1.4,1] + Rotate [0,±15°,0]
Duration:   400ms
Then:       Color changes gray → gold
            Fill changes outline → solid
```

---

## 🎬 Animation Timeline

### Card Hover Timeline (Desktop)
```
Time    Card    Image   Shadow  Button
0ms     ─       ─       ─       ─
50ms    ↑0.5px  zoom0.5 shadow0.5  fade0.1
100ms   ↑1px    zoom1   shadow1    fade0.3
150ms   ↑2px    zoom1.5 shadow1.5  fade0.6
200ms   ↑3px    zoom2   shadow2    fade0.8
250ms   ↑3.5px  zoom2.5 shadow2.5  fade0.95
300ms   ↑4px    zoom3   shadow3    fade1.0
↓       └─── Complete ───┘
```

### Quick Add Button Reveal
```
Time    Opacity Transform
0ms     0%      translateY(20px)
50ms    20%     translateY(15px)
100ms   40%     translateY(10px)
150ms   70%     translateY(5px)
200ms   90%     translateY(0px)
250ms   100%    translateY(0px)
↓       └─── Visible ───┘
```

---

## ✅ QA Checklist

### Visual
- [ ] Badges positioned correctly (top-left)
- [ ] Wishlist button floating (top-right)
- [ ] Product name max 2 lines (truncated with ellipsis)
- [ ] Price formatting correct (INR)
- [ ] Image aspect ratio 3:4
- [ ] Colors match spec (gold #D4AF77, pink #FFD6E8)

### Interaction
- [ ] Card lifts on hover (desktop)
- [ ] Image zooms smoothly on hover
- [ ] Quick add button appears on hover (desktop)
- [ ] Wishlist heart animates on click
- [ ] Add to bag shows spinner, then success
- [ ] Auto-reverts to default after 2 seconds

### Mobile
- [ ] Quick add button always visible
- [ ] Wishlist button accessible
- [ ] Text sizes readable
- [ ] Images load quickly
- [ ] Touch targets ≥44px

### Accessibility
- [ ] Keyboard navigable (Tab, Enter)
- [ ] Focus indicator visible
- [ ] Screen reader reads product name
- [ ] Color contrast >4.5:1
- [ ] respects prefers-reduced-motion

---

**Version:** 1.0 | **Status:** Production-Ready | **Last Updated:** Jan 21, 2026
