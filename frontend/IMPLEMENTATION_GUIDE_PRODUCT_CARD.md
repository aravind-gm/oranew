# Product Card Implementation Guide

**Status:** Ready to integrate  
**Component:** ProductCardProduction.tsx  
**Date:** January 21, 2026

---

## 🚀 5-Step Implementation Plan

### **STEP 1: Verify Dependencies** ✅
All required packages are already installed:
- ✅ `framer-motion@^10.16.16` — animations
- ✅ `lucide-react@^0.562.0` — icons
- ✅ `zustand@^4.5.7` — state management
- ✅ `next@^16.1.1` — Next.js app router
- ✅ `tailwindcss@^3.4.0` — styling

**No additional installations needed.**

---

### **STEP 2: Verify Store Setup** 🏪

Ensure your Zustand stores are configured.

**File:** `src/store/cartStore.ts`
```typescript
import { create } from 'zustand';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
}

export const useCartStore = create<CartStore>((set) => ({
  items: [],
  addItem: (item) => set((state) => ({
    items: [...state.items, item],
  })),
  removeItem: (id) => set((state) => ({
    items: state.items.filter((item) => item.id !== id),
  })),
  updateQuantity: (id, quantity) => set((state) => ({
    items: state.items.map((item) =>
      item.id === id ? { ...item, quantity } : item
    ),
  })),
}));
```

**File:** `src/store/wishlistStore.ts`
```typescript
import { create } from 'zustand';

interface WishlistStore {
  items: string[];
  toggleWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
}

export const useWishlistStore = create<WishlistStore>((set, get) => ({
  items: [],
  toggleWishlist: (productId) => set((state) => {
    const isInWishlist = state.items.includes(productId);
    return {
      items: isInWishlist
        ? state.items.filter((id) => id !== productId)
        : [...state.items, productId],
    };
  }),
  isInWishlist: (productId) => get().items.includes(productId),
}));
```

---

### **STEP 3: Prepare Product Data Structure** 📊

Ensure your product data matches this interface:

```typescript
interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  description?: string;
  category?: string;
  
  // Images
  image: {
    url: string;
    alt: string;
  };
  hoverImage?: {
    url: string;
    alt: string;
  };
  
  // Status
  isNew?: boolean;
  isBestseller?: boolean;
  discount?: number; // e.g., 10 for 10% off
  
  // Optional
  rating?: number;
  reviewCount?: number;
  material?: {
    name: string;
    color: string; // hex code
  };
}
```

---

### **STEP 4: Update Grid Layout** 🎨

**File:** `src/components/product/ProductGrid.tsx` (create if doesn't exist)

```tsx
import ProductCardProduction from './ProductCardProduction';

interface ProductGridProps {
  products: Product[];
  columns?: number;
}

export default function ProductGrid({ products, columns = 4 }: ProductGridProps) {
  return (
    <div className={`grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-${columns} xl:grid-cols-${columns}`}>
      {products.map((product) => (
        <ProductCardProduction
          key={product.id}
          product={product}
          onAddToCart={(item) => {
            console.log('Added to cart:', item);
            // Optional: Show toast notification
          }}
          onWishlistToggle={(productId, isWishlisted) => {
            console.log('Wishlist toggled:', productId, isWishlisted);
          }}
        />
      ))}
    </div>
  );
}
```

---

### **STEP 5: Integrate into Pages** 📄

**File:** `src/app/products/page.tsx` (example)

```tsx
'use client';

import { useState, useEffect } from 'react';
import ProductGrid from '@/components/product/ProductGrid';
import type { Product } from '@/types/product';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch products from your API
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/products');
        const data = await response.json();
        setProducts(data);
      } catch (error) {
        console.error('Failed to fetch products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <main className="container-luxury section-luxury">
      <h1 className="heading-display mb-12">Our Collection</h1>
      <ProductGrid products={products} columns={4} />
    </main>
  );
}
```

---

### **STEP 6: Styling Verification** 🎯

Ensure `globals.css` has all required utilities:

✅ Already present:
- `.card-luxury` — card base styling
- `.product-badge-new` — "New" badge
- `.product-badge-bestseller` — bestseller badge
- `.product-badge-sale` — discount badge
- `.btn-primary` — primary button

**No CSS changes needed.**

---

## 📋 Integration Checklist

### Before Launch:
- [ ] ProductCardProduction.tsx file verified
- [ ] Cart store configured and working
- [ ] Wishlist store configured and working
- [ ] Product data structure matches interface
- [ ] Product grid layout created
- [ ] Page-level integration complete
- [ ] Tailwind classes applied correctly
- [ ] Images are optimized (Next.js Image)
- [ ] API endpoints for cart/wishlist ready
- [ ] Analytics callbacks integrated (optional)

### Testing:
- [ ] Product cards render correctly
- [ ] Hover animations work (desktop)
- [ ] Mobile interactions work (touch)
- [ ] "Add to Bag" button adds to cart
- [ ] Wishlist heart animates and toggles
- [ ] Success state shows and reverts
- [ ] Images load properly
- [ ] Badges display correctly
- [ ] Responsive design works (mobile, tablet, desktop)
- [ ] No console errors

### Performance:
- [ ] Images lazy load
- [ ] No animation jank (60 FPS)
- [ ] Bundle size acceptable
- [ ] Lighthouse score >90

---

## 🔄 Integration Flow Diagram

```
Product Data
    ↓
ProductCardProduction Component
    ├→ Image loading (Next.js Image)
    ├→ Hover state (Framer Motion)
    ├→ Add to Cart (Zustand store)
    ├→ Wishlist toggle (Zustand store)
    └→ Success feedback (animation)
    ↓
ProductGrid (layout)
    ↓
Page Component (products/page.tsx)
```

---

## 🎯 Key Features to Verify

| Feature | Expected Behavior |
|---------|-------------------|
| **Image Hover** | Zooms 1.06x, crossfades if hoverImage exists |
| **Wishlist Heart** | Animates with scale + rotate, fills pink when wishlisted |
| **Add to Bag** | Shows spinner while loading, checkmark on success |
| **Card Lift** | Translatey -4px on hover (desktop) |
| **Shadow** | Deepens from `shadow-luxury` to `shadow-luxury-hover` |
| **Badges** | Gold/pink pills, positioned top-left |
| **Price Display** | Current bold, original strikethrough, savings in gold |
| **Mobile CTA** | Always visible, not hover-dependent |

---

## 🐛 Troubleshooting

### Issue: Cards not rendering
**Solution:** Check that Product data matches interface, images have valid URLs

### Issue: Animations janky
**Solution:** Ensure `framer-motion` is latest version, GPU acceleration enabled

### Issue: Cart not updating
**Solution:** Verify `useCartStore` is properly imported and connected to your backend

### Issue: Images not showing
**Solution:** Check Next.js Image optimization, verify image URLs are accessible

### Issue: Wishlist not persisting
**Solution:** Add localStorage integration to Zustand store

---

## 📞 Next Steps

1. **Verify all dependencies** are installed
2. **Set up/verify stores** (cart, wishlist)
3. **Create product grid** component
4. **Integrate into pages**
5. **Test thoroughly** on mobile and desktop
6. **Deploy to production**

---

## 📊 Success Metrics to Track

- **Click-through rate (CTR)** on product cards
- **Add-to-bag conversion rate**
- **Wishlist save rate**
- **Page load time**
- **Animation performance** (FPS)
- **Mobile conversion rate**
- **User engagement** (hover time, interactions)

---

**Ready to integrate? Follow the 5 steps above and your product cards will be production-ready!** 🚀
