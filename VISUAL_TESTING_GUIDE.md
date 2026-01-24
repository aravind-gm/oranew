# ORA JEWELLERY — VISUAL TESTING GUIDE

## Quick Visual Verification (5 Minutes)

### 1. HOME PAGE - Hero Section
```
URL: http://localhost:3000/
Expected:
  ✓ Background: Pure white (#FFFFFF)
  ✓ Hero image with gradient overlay
  ✓ "Shop Now" button: PINK (#ec4899)
  ✓ Text: Dark charcoal
  ✓ Overall feel: Premium, clean, elegant
```

### 2. COLLECTIONS PAGE
```
URL: http://localhost:3000/collections
Expected:
  ✓ Main area: White background
  ✓ Filter button: White → Pink on hover
  ✓ Product cards: White with images
  ✓ No pink backgrounds visible
  ✓ Products clearly stand out
```

### 3. PRODUCT CARD - Details
```
URL: http://localhost:3000/collections (hover over any product)
Expected:
  ✓ Card: White background
  ✓ Image: Fills card area
  ✓ Wishlist button (♥): White with border
  ✓ "Add to Bag": Black text on white
  ✓ Badge (NEW/SALE): Pink or red small badge
```

### 4. CART PAGE
```
URL: http://localhost:3000/cart
Expected:
  ✓ Main area: White background
  ✓ Cart items: White cards
  ✓ Price breakdown: Text on white
  ✓ "Checkout" button: PINK (#ec4899)
  ✓ No pink backgrounds, only white
```

### 5. ADMIN DASHBOARD
```
URL: http://localhost:3000/admin
Expected:
  ✓ Background: Dark gray (#111827)
  ✓ Text: Light gray/white
  ✓ Tables: Dark styling
  ✓ Buttons: Amber/blue accents
  ✓ ZERO storefront influence visible
  ✓ Completely separate from light theme
```

---

## Color Verification Checklist

### Storefront (Light Theme)
| Element | Expected Color | Hex | Status |
|---------|---|---|---|
| Main backgrounds | White | #FFFFFF | ✓ |
| Text primary | Charcoal | #1A1A1A | ✓ |
| Text secondary | Neutral | #78716b | ✓ |
| Primary buttons | Pink | #ec4899 | ✓ |
| Button hover | Deep pink | #db2777 | ✓ |
| Borders | Light gray | #E5E5E5 | ✓ |
| Cards | White | #FFFFFF | ✓ |

### Admin (Dark Theme)
| Element | Expected Color | Hex | Status |
|---------|---|---|---|
| Main backgrounds | Dark gray | #111827 | ✓ |
| Cards | Medium gray | #1f2937 | ✓ |
| Text primary | Light gray | #f3f4f6 | ✓ |
| Text secondary | Gray | #d1d5db | ✓ |
| Borders | Gray | #374151 | ✓ |
| Buttons | Amber | #b45309 | ✓ |

---

## Before/After Comparison

### Before (Pink-Heavy)
```
Page Load: Pink background fills entire viewport
            ↓
Product Grid: White cards on pink (low contrast)
              ↓
Impression: Overwhelming, too feminine, not luxury
```

### After (White + Pink Accents)
```
Page Load: Clean white background
           ↓
Product Grid: Products POP on white
              ↓
Impression: Premium, elegant, focused on products
```

---

## Testing on Different Devices

### Desktop (1920px)
- [ ] Hero section spans full width
- [ ] Product grid shows 4 columns
- [ ] Pink buttons are prominent
- [ ] No white space issues

### Tablet (768px)
- [ ] Hero section is readable
- [ ] Product grid shows 3 columns
- [ ] Text scaling is appropriate
- [ ] Buttons are easy to tap

### Mobile (375px)
- [ ] Hero section fits screen
- [ ] Product grid shows 2 columns
- [ ] Text is readable
- [ ] Buttons are tappable

---

## Specific Page Testing

### Collections Page Details
1. **Load page** → White background should be immediate
2. **Scroll down** → Sticky filter bar on white
3. **Click filter** → Button turns pink
4. **View products** → Cards clearly visible
5. **Hover product** → Add to bag button appears
6. **Pagination** → Active page number is pink

### Product Detail Page Details
1. **Load product** → White background
2. **View images** → High quality on white
3. **See price** → Clear dark text on white
4. **Check badges** → Pink "New In" or red "Sale"
5. **Hover wishlist** → Border becomes pink
6. **Hover add to cart** → Button highlights

### Cart Page Details
1. **Load cart** → White background
2. **See items** → Each row has subtle border
3. **Edit quantities** → Dark text on white inputs
4. **See totals** → Price breakdown clear
5. **Checkout button** → Pink, prominent

---

## Common Issues to Watch For

### Issue: Page still shows pink
**Solution:** 
- Clear browser cache: Ctrl+Shift+Delete
- Rebuild frontend: `npm run build`
- Restart dev server: Kill and `npm run dev`

### Issue: Admin shows light theme
**Solution:**
- Check admin/layout.tsx has `data-admin-root`
- Verify admin-dark-theme.css is imported
- Clear cache and restart

### Issue: Pink appears on wrong elements
**Solution:**
- Check tailwind.config.js for color values
- Verify globals.css button classes
- Search for inline style overrides

---

## Performance Check

### Metrics to Monitor
- [ ] Page load time: < 3 seconds
- [ ] Time to interactive: < 5 seconds
- [ ] No layout shift (CLS < 0.1)
- [ ] Images loading correctly
- [ ] No console errors
- [ ] Lighthouse score > 90

### Network Tab
- [ ] CSS bundles load
- [ ] Images load from CDN
- [ ] No 404 errors
- [ ] No failed requests

---

## Accessibility Check

### Color Contrast
- [ ] Text on white: 4.5:1 ratio ✓ (charcoal on white)
- [ ] Buttons have focus states ✓
- [ ] Links are underlined/distinct ✓
- [ ] Icons have aria-labels ✓

### Screen Reader
- [ ] Headings have hierarchy
- [ ] Buttons have descriptive text
- [ ] Images have alt text
- [ ] Links have titles

---

## Final Verification Checklist

- [ ] Home page: White background, pink accents only
- [ ] Collections: No pink backgrounds visible
- [ ] Product cards: White with clear contrast
- [ ] Buttons: Pink on white (high contrast)
- [ ] Cart: White, pink checkout button
- [ ] Admin: Dark theme, isolated, no bleed
- [ ] Mobile: Responsive, readable
- [ ] Accessibility: WCAG AA compliant
- [ ] Performance: Fast loading
- [ ] Browser console: Zero errors

**Status: READY FOR LAUNCH ✅**

---

## Browser Testing

### Tested Browsers
- [ ] Chrome 120+
- [ ] Firefox 121+
- [ ] Safari 17+
- [ ] Edge 120+
- [ ] Mobile Safari (iOS 17+)
- [ ] Chrome Mobile (Android 14+)

### Expected Results
All browsers should show:
- White backgrounds (no pink)
- Pink buttons and accents
- Proper text contrast
- Smooth animations
- No layout shifts

---

## Rollback Instructions (If Needed)

If any issue requires immediate rollback:

1. **Revert tailwind.config.js:**
   ```javascript
   background: '#ffd6e9', // Pink backgrounds (original)
   ```

2. **Rebuild:**
   ```bash
   npm run build
   npm run dev
   ```

3. **Clear cache and reload**

**⚠️ Note:** Rollback to pink is NOT recommended. Pink backgrounds damage luxury perception.

---

## Sign-Off

**Visual Test Date:** _______________
**Tested By:** _______________
**Result:** ✅ PASS / ❌ FAIL

**Notes:**
_________________________________
_________________________________
_________________________________

**Ready for Production:** ☐ YES  ☐ NO
