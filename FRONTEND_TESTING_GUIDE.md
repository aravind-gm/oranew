# Frontend Testing Guide - Mobile & Desktop

## Quick Start Testing

### 1. Start Development Server
```bash
cd /home/aravind/Downloads/oranew/frontend
npm run dev
# Opens on http://localhost:3000
```

### 2. Run Build Test
```bash
npm run build
# Should complete with no errors (✓ Compiled successfully)
```

---

## 📱 MOBILE TESTING (375px - iPhone SE)

### Test 1: Navigation & Header
```
Steps:
1. Open browser DevTools (F12)
2. Click device toggle icon (top-left of DevTools)
3. Select "iPhone SE" or set viewport to 375x667
4. Reload page

Expected Results:
✅ Logo is smaller (h-8 instead of h-10)
✅ Search icon visible
✅ Wishlist icon hidden (xs breakpoint)
✅ Cart icon visible with count badge
✅ No horizontal scroll
✅ Announcement bar text readable
✅ Tap areas are at least 44px tall

Test URL: http://localhost:3000
```

### Test 2: Home Page Hero Section
```
Steps:
1. Load home page on 375px viewport
2. Scroll to see hero section
3. Check CTA buttons

Expected Results:
✅ Hero section height is 70vh (not full screen)
✅ Headline scales down: text-3xl (not text-6xl)
✅ CTA buttons stack vertically (flex-col)
✅ Scroll indicator hidden on mobile
✅ Text is readable (no blur)
✅ Images load properly

Test URL: http://localhost:3000
```

### Test 3: Collections Page - Product Grid
```
Steps:
1. Navigate to Collections
2. Verify product grid layout
3. Scroll through products
4. Test filter button

Expected Results:
✅ Grid shows 2 columns on mobile (grid-cols-2)
✅ Gaps are 3 (gap-3) not gap-6
✅ Product images load with proper aspect ratio (3:4)
✅ "Filter" button has 44px minimum height
✅ Filter dropdown closes on Escape
✅ No horizontal scroll
✅ Pagination buttons are touch-friendly

Test URL: http://localhost:3000/collections
```

### Test 4: Form Inputs - Addresses Page
```
Steps:
1. Navigate to Account > Addresses
2. Click "Add Address" or login first
3. Focus on any input field
4. Type a character

Expected Results:
✅ Input height is at least 52px (min-h-[52px])
✅ Font size is 16px base (prevents iOS zoom)
✅ Label is properly associated (click label focuses input)
✅ Focus ring visible (ring-2 ring-primary)
✅ Border color is from design tokens (not gray-300)
✅ Text cursor visible at font size
✅ Form can be filled without zooming

Test URL: http://localhost:3000/account/addresses
```

### Test 5: Shopping Cart & Checkout
```
Steps:
1. Add a product to cart (if empty)
2. Go to /cart
3. View cart summary
4. Try to increment/decrement quantity
5. Proceed to checkout

Expected Results:
✅ Cart items display as cards on mobile
✅ Sticky bottom bar with "Proceed to Checkout"
✅ No content hidden by sticky bar
✅ Quantity controls are 44px tap targets
✅ Table layout hidden (grid-cols-1 on mobile)
✅ Price updates animate smoothly
✅ Checkout button is full-width and tap-friendly

Test URLs: 
- http://localhost:3000/cart
- http://localhost:3000/checkout
```

### Test 6: Image Loading
```
Steps:
1. Go to Collections
2. Open DevTools Network tab
3. Look for image requests
4. Check image sizes loaded

Expected Results:
✅ Mobile loads ~375px wide images (not full 600px)
✅ Images use responsive sizes: (max-width: 640px) 50vw
✅ Images have proper aspect ratio (no distortion)
✅ Load time < 2 seconds per image
✅ No broken images

Test URL: http://localhost:3000/collections
```

### Test 7: Safe Area on iOS
```
Steps:
1. On actual iOS device:
   - Open Safari
   - Go to http://[your-ip]:3000
   - Navigate to checkout
   
Expected Results:
✅ Sticky bottom bar respects safe-area-inset
✅ No content hidden behind notch
✅ Buttons fully clickable at bottom
✅ No layout shift when keyboard appears

Note: Requires actual iOS device or iOS simulator
```

### Test 8: Touch Interactions
```
Steps:
1. Use mouse to simulate touch
2. Tap buttons
3. Tap wishlist heart icon
4. Tap add to cart

Expected Results:
✅ All buttons have hover states (optional on mobile)
✅ Heart icon animates on tap
✅ Add to cart shows "Added" feedback
✅ No delay in button response
✅ Buttons don't have :hover-only features

Test URL: http://localhost:3000/collections
```

---

## 🖥️ DESKTOP TESTING (1024px+)

### Test 1: Full Header Navigation
```
Steps:
1. Open on desktop (1024px+)
2. Verify header layout
3. Hover over nav items

Expected Results:
✅ PillNav visible and animated (GSAP)
✅ Nav items have smooth transitions
✅ Logo is larger (h-10)
✅ Search, Wishlist, Cart all visible
✅ User menu dropdown works on hover
✅ No mobile UI elements visible
✅ Smooth scroll behavior

Test URL: http://localhost:3000
```

### Test 2: Collections Page - Desktop Grid
```
Steps:
1. Go to Collections on 1024px+ viewport
2. Verify grid layout
3. Hover over product cards
4. Test filter dropdown

Expected Results:
✅ Grid shows 3-4 columns (depends on width)
✅ Larger gaps (gap-6 or gap-8)
✅ Product cards have hover lift effect
✅ Second image swaps on hover
✅ Quick add button appears on hover
✅ Filter button shows full text
✅ Pagination has arrow buttons

Test URL: http://localhost:3000/collections
```

### Test 3: Product Detail Page
```
Steps:
1. Click on a product card
2. View product details
3. Scroll through reviews
4. Add to cart

Expected Results:
✅ Product images layout properly (gallery)
✅ Specs display in grid format
✅ Review section has proper spacing
✅ Add to cart button is prominent
✅ Wishlist button works
✅ Images swap smoothly
✅ No layout shifts while scrolling

Test URL: http://localhost:3000/products/[slug]
```

### Test 4: Form Inputs - Checkout
```
Steps:
1. Go to /checkout
2. Fill in address form
3. Tab between fields
4. Submit form

Expected Results:
✅ Inputs are larger (py-3.5)
✅ Focus ring is visible
✅ Tab order is logical
✅ Labels are associated
✅ Error messages appear inline
✅ Form validation works
✅ Submit button is disabled while loading

Test URL: http://localhost:3000/checkout
```

### Test 5: Animations & Interactions
```
Steps:
1. Watch page load animations
2. Hover over various elements
3. Scroll and observe animations

Expected Results:
✅ Animations are smooth (60fps)
✅ No jank or stuttering
✅ Hover effects are subtle
✅ Scroll animations are performant
✅ Product cards animate in on scroll
✅ No excessive motion for reduced-motion users

Test URL: http://localhost:3000
```

### Test 6: Responsive Design (Tablet 768px)
```
Steps:
1. Set viewport to 768px width
2. Navigate main pages
3. Test forms
4. Check grid layouts

Expected Results:
✅ Layout adapts properly (sm: breakpoint)
✅ Grid shows 2-3 columns
✅ Form fields have proper spacing
✅ Buttons are appropriately sized
✅ No content overflow
✅ Navigation works smoothly

Test URL: http://localhost:3000
```

---

## 🧪 AUTOMATED TESTING COMMANDS

### Build Test
```bash
cd /home/aravind/Downloads/oranew/frontend
npm run build
# Expected: ✓ Compiled successfully
```

### Lighthouse Analysis (Desktop)
```bash
# Using Chrome DevTools:
1. F12 → Lighthouse tab
2. Audit for Desktop
3. Target scores: 90+ Performance, 95+ Accessibility

# Expected results:
- Performance: 85+ (images, bundle size good)
- Accessibility: 90+ (ARIA labels added)
- Best Practices: 95+
- SEO: 95+
```

### Lighthouse Analysis (Mobile)
```bash
# Using Chrome DevTools:
1. F12 → Lighthouse tab
2. Audit for Mobile
3. Target scores: 85+ Performance, 90+ Accessibility

# Expected results:
- Performance: 80+ (images optimized)
- Accessibility: 90+ (touch targets 44px)
- Best Practices: 95+
- SEO: 95+
```

---

## 🐛 COMMON ISSUES & FIXES

### Issue: Mobile buttons too small
**Solution:** Check for `min-h-[44px]` in button classes
**File:** Components using buttons

### Issue: Form inputs zoom on iOS
**Solution:** Ensure `text-base sm:text-sm` and NOT `text-sm` on mobile
**File:** [frontend/src/app/account/addresses/page.tsx](frontend/src/app/account/addresses/page.tsx)

### Issue: Sticky bars hide content
**Solution:** Add padding-bottom equal to bar height
**Example:** `pb-32 sm:pb-0` on cart page

### Issue: Images load slowly on mobile
**Solution:** Verify `sizes` prop is set on Image component
**File:** [frontend/src/components/product/ProductCardProduction.tsx](frontend/src/components/product/ProductCardProduction.tsx)

### Issue: Horizontal scroll on mobile
**Solution:** Check for hardcoded widths, use `w-full` and `max-w-full`
**Files:** Review all `w-[...]` properties

### Issue: Layout shift on loading
**Solution:** Add aspect-ratio containers or explicit height
**Example:** `aspect-[3/4]` for product images

---

## ✅ PRE-DEPLOYMENT CHECKLIST

### Mobile (375px - 480px)
- [ ] All text readable without zooming
- [ ] No horizontal scroll anywhere
- [ ] All buttons/links 44px+ tap targets
- [ ] Form inputs don't trigger zoom on iOS
- [ ] Sticky elements respect safe-area-inset
- [ ] Images load and display correctly
- [ ] Animations perform smoothly
- [ ] Touch interactions work (no delays)

### Tablet (768px - 1024px)
- [ ] Layout adapts at 768px breakpoint
- [ ] Grid shows correct column count
- [ ] Form inputs properly sized
- [ ] Navigation works smoothly
- [ ] No content overflow

### Desktop (1024px+)
- [ ] Full navigation visible
- [ ] Hover effects work smoothly
- [ ] Product cards have proper spacing
- [ ] Images display at optimal size
- [ ] Animations perform smoothly (60fps)
- [ ] No visual inconsistencies

### Performance
- [ ] Lighthouse Performance > 85 (mobile), > 90 (desktop)
- [ ] Lighthouse Accessibility > 90
- [ ] Lighthouse Best Practices > 95
- [ ] Lighthouse SEO > 95
- [ ] Core Web Vitals all green

### Accessibility
- [ ] All icon buttons have aria-label
- [ ] All form inputs have associated labels
- [ ] Form errors announced
- [ ] Color contrast meets AA standards
- [ ] Keyboard navigation works
- [ ] No flash content
- [ ] Focus visible on all interactive elements

---

## 📊 TESTING SUMMARY

| Test Case | Mobile | Tablet | Desktop | Status |
|-----------|--------|--------|---------|--------|
| Navigation | ✅ | ✅ | ✅ | Ready |
| Forms | ✅ | ✅ | ✅ | Ready |
| Images | ✅ | ✅ | ✅ | Ready |
| Checkout | ✅ | ✅ | ✅ | Ready |
| Cart | ✅ | ✅ | ✅ | Ready |
| Responsive | ✅ | ✅ | ✅ | Ready |
| Performance | ⚠️ | ✅ | ✅ | Monitor |
| Accessibility | ✅ | ✅ | ✅ | Ready |

---

**Testing Date:** January 28, 2026  
**Next Review:** After deployment  
**Contact:** Use browser console for errors
