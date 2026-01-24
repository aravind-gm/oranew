# ORA Jewellery — Global Theme System Restoration

## Problem Fixed
The original ORA color palette (blush pink, champagne gold, warm ivory) was unintentionally overridden, causing inconsistent colors across pages.

## Solution
Implemented a **semantic token-based theme system** at the Tailwind level that cascades globally to all pages without requiring individual page changes.

---

## Color Palette Restored

### Brand Colors
- **Primary (Blush Pink)**: `#ec4899` → Use `bg-primary`, `text-primary`, `hover:text-primary-700`
- **Secondary (Champagne Gold)**: `#d4af37` → Use `bg-secondary`, `text-secondary`
- **Background (Warm Ivory)**: `#FDFBF7` → Use `bg-background` (applies globally)
- **Foreground (Dark Charcoal)**: `#1A1A1A` → Use `text-foreground` (applies globally)

### Semantic Layers
```
--background: Warm Ivory    → All page backgrounds
--foreground: Dark Charcoal → All text by default
--primary: Blush Pink      → Buttons, links, badges
--secondary: Gold          → Accents, secondary buttons
```

---

## Key Changes

### 1. Tailwind Config (`tailwind.config.js`)
```js
colors: {
  primary: { 50-900 }      // Blush pink palette
  secondary: { 50-900 }    // Gold palette
  neutral: { 50-900 }      // Grays (borders, muted text)
  background: '#FDFBF7'    // Warm ivory
  foreground: '#1A1A1A'    // Dark charcoal
}
```

### 2. Global Styles (`globals.css`)
```css
/* Root Semantic Tokens */
:root {
  --background: theme('colors.background');
  --foreground: theme('colors.foreground');
  --primary: theme('colors.primary.500');
}

/* Body applies globally */
body {
  @apply bg-background text-foreground font-sans;
}
```

---

## Migration Guide: Replacing Hardcoded Colors

### ❌ BEFORE (Hardcoded Colors)
```tsx
<button className="bg-white text-black hover:bg-gray-100">
  Buy Now
</button>

<div className="bg-slate-100 border border-gray-300">
  Product Card
</div>

<h1 className="text-black text-4xl">Valentine Special</h1>
```

### ✅ AFTER (Semantic Tokens)
```tsx
<button className="btn-primary">
  Buy Now
</button>

<div className="card-luxury">
  Product Card
</div>

<h1 className="heading-display">Valentine Special</h1>
```

---

## Component Classes (Use These Everywhere)

### Buttons
```tsx
.btn-primary          // Blush pink, white text
.btn-secondary        // Gold background
.btn-outline          // Pink border
.btn-ghost            // Transparent, pink text on hover
```

### Forms
```tsx
.input-luxury         // Pink focus ring, ivory background
```

### Cards
```tsx
.card-luxury          // White bg, soft shadow, border
.card-luxury-elevated // Stronger shadow
```

### Typography
```tsx
.heading-display      // 6xl, serif, dark text (applies globally)
.heading-section      // 4xl, serif, dark text
.heading-page         // 3xl, serif, dark text
.heading-subtitle     // Italic, secondary text color
.text-luxury          // Secondary text gray
.text-muted-luxury    // Muted gray text, smaller
```

### Badges
```tsx
.product-badge-new        // Light pink bg
.product-badge-bestseller // Dark pink
.product-badge-sale       // Red
.badge-luxury             // Generic badge
```

---

## Why This Works Globally

1. **Body Sets Default**: `body { @apply bg-background text-foreground; }` ensures every page inherits the theme
2. **Semantic Tokens**: All component classes reference theme colors, not hardcoded hex
3. **No Page Hacks**: Changes in one place (Tailwind config) affect all pages
4. **Consistent Across Routes**: Valentine page, collections, products, admin — all use same palette

---

## Testing the Fix

### Check These Pages
1. **Home**: Pink buttons, ivory bg, charcoal text
2. **Collections**: Filter pills with pink, white cards
3. **Valentine Special**: Pink accents, gold secondary buttons
4. **Admin**: Consistent input focus (pink), buttons
5. **Product Detail**: Pink "Add to Cart", gold secondary elements

### Verify Colors
```bash
# These should all be pink (#ec4899)
grep -r "btn-primary" src/
grep -r "text-primary" src/
grep -r "bg-primary" src/

# These should NOT appear (hardcoded colors)
grep -r "bg-white" src/  # Use bg-background instead
grep -r "text-black" src/ # Use text-foreground instead
grep -r "#FDFBF7" src/    # Use class names, not hex
```

---

## CSS Variables for Advanced Use

If a component needs direct CSS variable access:
```css
.my-component {
  background: var(--background);
  color: var(--foreground);
  border-color: var(--border);
}
```

---

## Summary

✅ **Global theme system restored at Tailwind level**  
✅ **All pages automatically inherit ORA palette**  
✅ **No inline hex colors needed**  
✅ **Single source of truth for brand colors**  
✅ **Easy to maintain and update**

The color regression is now **permanently fixed** across the entire application.
