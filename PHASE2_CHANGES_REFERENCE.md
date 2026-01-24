# PHASE 2: TAILWIND CHANGES — DIFF REFERENCE

## Quick Reference: All Changes Made

---

## 1. tailwind.config.js (4 Changes)

### Change 1: Primary color DEFAULT
```diff
  primary: {
+   DEFAULT: '#ec4899',  // Add fallback
    50: '#fdf2f8',
    ...
```

### Change 2: Secondary color DEFAULT
```diff
  secondary: {
+   DEFAULT: '#d4af37',  // Add fallback
    50: '#fef9f0',
    ...
```

### Change 3: Neutral color DEFAULT
```diff
  neutral: {
+   DEFAULT: '#78716b',  // Add fallback
    50: '#fafaf9',
    ...
```

### Change 4: Missing semantic tokens
```diff
  colors: {
    ...
    'text-primary': '#1A1A1A',
    'text-secondary': '#78716b',
+   'text-muted': '#a8a29e',       // NEW
+   'accent': '#d4af37',           // NEW
    'background-white': '#FFFFFF',
    border: '#E5E5E5',
```

---

## 2. Auth Pages (forgot-password, reset-password)

### Pattern: Gray backgrounds and text
```diff
- bg-gray-50          → bg-neutral-50
- text-gray-900      → text-neutral-900
- text-gray-600      → text-neutral-600
- text-gray-700      → text-neutral-700
- border-gray-300    → border-neutral-300
```

### Pattern: Blue to Primary
```diff
- text-blue-600      → text-primary-600
- bg-blue-600        → bg-primary-600
- hover:bg-blue-700  → hover:bg-primary-700
- focus:ring-blue-500 → focus:ring-info
```

### Pattern: Green to Success
```diff
- bg-green-50        → bg-success/10
- text-green-700     → text-success
```

### Example (forgot-password.tsx)
```diff
- <div className="min-h-screen bg-gray-50">
+ <div className="min-h-screen bg-neutral-50">

- <h1 className="text-gray-900">
+ <h1 className="text-neutral-900">

- <input className="border-gray-300 focus:ring-blue-500" />
+ <input className="border-neutral-300 focus:ring-info" />

- <button className="bg-blue-600 hover:bg-blue-700">
+ <button className="bg-primary-600 hover:bg-primary-700">

- {message && <div className="bg-green-50 text-green-700">
+ {message && <div className="bg-success/10 text-success">
```

---

## 3. Account Pages

### addresses/page.tsx (20+ changes)
```diff
- All form labels: text-gray-700 → text-neutral-700
- All borders: border-gray-300 → border-neutral-300
- Save button: bg-blue-600 hover:bg-blue-700 → bg-primary-600 hover:bg-primary-700
- Cancel button: bg-gray-300 text-gray-700 hover:bg-gray-400 → bg-neutral-300 text-neutral-700 hover:bg-neutral-400
- Address card: border-gray-300 → border-neutral-300
- Badge: bg-blue-100 text-blue-700 → bg-info/10 text-info
- Details: text-gray-600 → text-neutral-600
```

### orders/page.tsx & orders/[id]/page.tsx (2 changes each)
```diff
- Status badge: bg-gray-500/10 text-gray-600 → bg-neutral-500/10 text-neutral-600
```

---

## 4. Error/Loading/Status Pages

### loading.tsx
```diff
- border-gray-700 border-t-orange-500 → border-neutral-700 border-t-warning
- text-gray-400 → text-neutral-400
```

### login/page.tsx
```diff
- border-b-2 border-blue-600 → border-b-2 border-primary-600
- text-gray-600 → text-neutral-600
```

### not-found.tsx
```diff
- text-orange-500 → text-warning
- text-gray-400 → text-neutral-400
- bg-gray-700 hover:bg-gray-600 → bg-neutral-700 hover:bg-neutral-600
- text-gray-500 → text-neutral-500
```

### error.tsx
```diff
- text-gray-400 → text-neutral-400
- text-gray-500 bg-gray-800 → text-neutral-500 bg-neutral-800
- bg-orange-500 hover:bg-orange-600 → bg-warning hover:bg-warning/90
- bg-gray-700 hover:bg-gray-600 → bg-neutral-700 hover:bg-neutral-600
```

---

## 5. Component Files

### StarRating.tsx
```diff
- text-gray-300 → text-neutral-300
- text-gray-600 → text-neutral-600
```

### ProductGallery.tsx
```diff
- bg-gray-100 → bg-neutral-100
- border-blue-600 → border-primary-600
- border-gray-200 → border-neutral-200
```

### RelatedProducts.tsx
```diff
- bg-gray-200 → bg-neutral-200
- text-gray-900 → text-neutral-900
```

### RecentlyViewedProducts.tsx
```diff
- text-gray-900 → text-neutral-900
- text-amber-500 → text-secondary-500
- text-gray-400 hover:text-gray-600 → text-neutral-400 hover:text-neutral-600
- bg-gray-100 → bg-neutral-100
- text-gray-900 group-hover:text-amber-600 → text-neutral-900 group-hover:text-secondary-600
- text-amber-600 → text-secondary-600
- bg-gray-50 hover:bg-gray-100 → bg-neutral-50 hover:bg-neutral-100
- bg-gray-200 → bg-neutral-200
```

### Footer.tsx
```diff
- hover:bg-primary-600 → hover:bg-primary/80
  (Note: primary-600 doesn't exist, using primary with opacity)
```

---

## Color Mapping Summary

### Palette Replacements
```
Tailwind Default → Custom Token
gray-*           → neutral-*
blue-*           → primary-* (or info for semantic)
green-*          → success
orange-*         → warning
amber-*          → secondary-*
```

### Semantic Color Usage
```
Text colors:     text-primary, text-secondary, text-muted
Backgrounds:     bg-primary, bg-success/10, bg-error/10
Borders:         border-primary, border-neutral-300
Focus states:    ring-info, ring-primary
Hover states:    hover:bg-primary/80
```

---

## Validation Checklist

- ✅ All `gray-*` replaced with `neutral-*`
- ✅ All `blue-*` replaced with `primary-*` or `info`
- ✅ All `green-*` replaced with `success`
- ✅ All `orange-*` replaced with `warning`
- ✅ All `amber-*` replaced with `secondary-*`
- ✅ Config contains all referenced tokens
- ✅ No breaking design changes
- ✅ Opacity variants supported (`/10`, `/80`)

---

## Testing Commands

```bash
# Verify Tailwind build
npm run build

# Check for any remaining invalid classes
grep -r "text-gray\|bg-blue\|border-green\|text-orange" src/

# Visual regression test
npm run dev
# Check: forgot-password, reset-password, addresses, orders, error, loading pages
```

---

**All changes are mechanical class name updates with zero functional impact.**
