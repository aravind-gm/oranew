# CODE CHANGES REFERENCE - COPY PASTE GUIDE

## FILES MODIFIED

1. `frontend/src/components/RelatedProductsCart.tsx` - COMPLETE REWRITE
2. `frontend/src/app/checkout/page.tsx` - STYLING & VALIDATION IMPROVEMENTS

---

## KEY COLOR CHANGES

All instances of:
- `bg-text-primary` → `bg-accent` (for action buttons)
- `text-text-primary` → `text-accent` (for totals/amounts)
- `border-border/40` → `border-2 border-border/30` (thicker, subtle borders)
- `focus:border-text-primary` → `focus:border-accent` (gold focus)

---

## COMPONENT IMPORTS NEEDED

Already in use, no new imports required:
```tsx
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Heart, Lock } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useCartStore } from '@/store/cartStore';
import { useCartNotificationStore } from '@/store/cartNotificationStore';
import api from '@/lib/api';
```

---

## TAILWIND CLASSES ADDED

All classes already available in `tailwind.config.js`:

```css
/* Accent Color (Gold) */
text-accent
bg-accent
hover:bg-accent
hover:bg-accent/90
focus:border-accent
text-accent/5
text-accent/20
border-accent/20
border-accent/30

/* Spacing */
gap-3 gap-4 gap-6
px-4 py-3 py-3.5 py-4
mb-2 mb-4 mb-5 mb-6 mb-8

/* Sizing */
w-5 h-5 w-10 h-10
min-h-[48px] min-h-[52px] min-h-[56px] min-h-[60px] min-h-[72px]
rounded-xl rounded-2xl
rounded-full

/* Shadows */
shadow-sm shadow-md shadow-lg hover:shadow-lg

/* Border Radius */
rounded-lg rounded-xl rounded-2xl rounded-full

/* Background Gradients */
bg-gradient-to-br
from-[#FFF5F7]
via-[#FFEBF0]
to-[#FFF0F3]
from-accent/5
via-accent/3
to-transparent

/* Effects */
hover:scale-110 hover:scale-1.02 scale-0.98
opacity-0 opacity-1 opacity-50
rotate-full animate-spin
```

---

## MOTION ANIMATIONS PATTERNS

### Product Card Stagger
```tsx
<motion.div
  initial={{ opacity: 0, y: 10 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: index * 0.1 }}
>
```

### Button Interactions
```tsx
<motion.button
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
>
```

### Hover Effects
```tsx
<motion.div whileHover={{ y: -6 }}>
```

### Smooth Slide
```tsx
<motion.div
  initial={{ y: 100 }}
  animate={{ y: 0 }}
>
```

---

## FORM VALIDATION PATTERNS

### Phone Validation
```tsx
// Already exists in checkout page
if (!address.phone.trim() || !validatePhoneNumber(address.phone)) {
  setError('Valid 10-digit phone number is required');
  return;
}
```

### Pincode Validation
```tsx
// Already exists in checkout page
if (!validatePincode(address.zipCode)) {
  setError('Pincode must be 6 digits');
  return;
}
```

### Email Validation
```tsx
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address.email)) {
  setError('Valid email is required');
  return;
}
```

---

## STATE/DISTRICT DROPDOWN USAGE

```tsx
import { getStateNames, getDistrictsByState } from '@/lib/addressData';

// Get all states
getStateNames() // Returns: ['Andhra Pradesh', 'Arunachal Pradesh', ...]

// Get districts for a state
getDistrictsByState('Maharashtra') // Returns: [{name: 'Mumbai', ...}, ...]

// In select element
<select name="state" onChange={handleAddressChange}>
  <option value="">Select state</option>
  {getStateNames().map(state => (
    <option key={state} value={state}>{state}</option>
  ))}
</select>

// Dependent select
<select name="district" disabled={!address.state}>
  <option value="">{address.state ? 'Select district' : 'Select state first'}</option>
  {address.state && getDistrictsByState(address.state).map(district => (
    <option key={district.name} value={district.name}>{district.name}</option>
  ))}
</select>
```

---

## API ENDPOINT CALLS

### Related Products Fetch
```tsx
const [relatedRes, valentineRes] = await Promise.all([
  api.get('/products', { 
    params: {
      limit: 6,
      sort: '-sales',
    }
  }),
  api.get('/products', { 
    params: {
      limit: 6,
      tags: ['valentine', 'gift', 'tumbler'],
      sort: '-createdAt',
    }
  }),
]);
```

### Checkout API
```tsx
const response = await api.post('/orders/checkout', {
  items: orderItems,
  shippingAddress: address,
  couponCode: null,
});
```

---

## COLOR REFERENCE QUICK LOOKUP

```javascript
// In tailwind.config.js - accent color definition:
'accent': '#d4af37',  // Champagne gold

// Usage in className:
className="bg-accent text-white"         // Gold background, white text
className="text-accent"                  // Gold text
className="border-accent"                // Gold border
className="focus:border-accent"          // Gold on focus
className="hover:bg-accent/90"           // Gold with opacity on hover
className="from-accent/5"                // Very light gold gradient
className="bg-accent/5"                  // Light gold background
```

---

## BREAKPOINT REFERENCE

```tailwind
Mobile:   < 640px   (sm)
Tablet:   640px+    (sm:) — responsive starts here
Desktop:  1024px+   (lg:) — full desktop experience
```

### Usage Examples
```tsx
// Mobile only
<div className="block sm:hidden">Mobile</div>

// Tablet & up
<div className="hidden sm:block">Tablet+</div>

// Desktop only
<div className="hidden lg:block">Desktop</div>

// Different layouts
<div className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" />
// Mobile: 1 column, Tablet: 2 columns, Desktop: 3 columns
```

---

## COMMON PATTERNS USED

### Product Card Container
```tsx
<motion.div
  className="group rounded-2xl border border-[#FFD6E8] bg-white overflow-hidden hover:shadow-lg"
>
  {/* Content */}
</motion.div>
```

### Premium Button
```tsx
<motion.button
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
  className="py-4 bg-accent text-white rounded-full font-semibold hover:bg-accent/90 min-h-[52px]"
>
  Action
</motion.button>
```

### Form Input
```tsx
<input
  type="text"
  className="w-full px-4 py-3.5 bg-background-white border-2 border-border/30 rounded-lg focus:border-accent focus:outline-none transition-colors"
/>
```

### Premium Background Section
```tsx
<div className="bg-gradient-to-br from-[#FFF5F7] via-[#FFEBF0] to-[#FFF0F3] rounded-2xl p-8 border border-[#FFD6E8]/50">
  {/* Content */}
</div>
```

---

## TESTING QUERIES

### Check Gold Color Applied
```javascript
// In browser console
document.querySelector('[class*="bg-accent"]').style.backgroundColor
// Should return: #d4af37
```

### Check Border Thickness
```javascript
const input = document.querySelector('input[name="state"]');
window.getComputedStyle(input).borderWidth
// Should return: 2px
```

### Check Animations Working
```javascript
// Hover over a product card
// Should see Y translation of -6px (check DevTools Animations tab)
```

---

## PERFORMANCE TIPS

1. **Product Images**
   - Already lazy-loaded via Next.js Image component
   - No additional optimization needed

2. **Animations**
   - Using Framer Motion optimized for performance
   - Transform/opacity only (no layout shifts)
   - Use `will-change: transform` for smooth animations

3. **Form Performance**
   - 28 states × 30 districts = ~840 options (acceptable)
   - No heavy computations
   - Debounce not needed

4. **Bundle Size**
   - No new dependencies added
   - Only CSS class additions
   - No impact on build size

---

## MIGRATION CHECKLIST FOR DEVELOPERS

If updating from old version:

- [ ] Update `RelatedProductsCart.tsx` completely
- [ ] Update button colors in `checkout/page.tsx`
- [ ] Update form input styling
- [ ] Update form validation messages
- [ ] Verify state/district dropdowns work
- [ ] Test mobile layout at 375px
- [ ] Test all form validations
- [ ] Check animations are smooth
- [ ] Verify no console errors
- [ ] Test on real devices (iOS, Android)
- [ ] Test on slow 3G network
- [ ] Monitor performance metrics

---

## QUICK COPY-PASTE: ACCENT COLOR USAGE

Replace these throughout:

```tsx
// OLD
className="bg-text-primary text-background"
className="hover:bg-text-secondary"

// NEW
className="bg-accent text-white"
className="hover:bg-accent/90 text-white"
```

---

## DEBUGGING COMMON ISSUES

### Issue: Colors not showing
```javascript
// Check if Tailwind is rebuilding
// Remove .next cache and restart
rm -rf .next
npm run dev
```

### Issue: Related products not loading
```javascript
// Check API response in Network tab
// Should see products array in /api/products response
```

### Issue: Animations stuttering
```javascript
// Open DevTools → Performance tab
// Record interaction → Look for main thread blocking
// If blocking, check for heavy JS in parent component
```

---

## FILES YOU DON'T NEED TO CHANGE

✅ `tailwind.config.js` - Already has accent color  
✅ `lib/addressData.ts` - Already complete  
✅ `store/cartStore.ts` - Unchanged  
✅ `store/authStore.ts` - Unchanged  
✅ `lib/api.ts` - Unchanged  

---

**Last Updated:** February 2, 2026  
**Version:** 1.0  
**Status:** Ready for Production ✅
