# ORA Homepage Component Architecture

## 📊 Visual Structure

```
┌─────────────────────────────────────────────────────────────────┐
│                        /app/(store)/page.tsx                     │
│                        Main Homepage Component                    │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  │
        ┌─────────────────────────┴─────────────────────────┐
        │                                                     │
        ▼                                                     ▼
┌───────────────────┐                              ┌────────────────────┐
│   Section Flow    │                              │  Component Props   │
└───────────────────┘                              └────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  1. HomeHero                                                         │
│     Purpose: First impression, brand positioning                     │
│     Admin: Images, text, CTAs configurable                          │
│     ├─ Desktop Image (Priority loaded)                              │
│     ├─ Mobile Image (Responsive)                                    │
│     ├─ Headline & Subtitle (Editable)                               │
│     ├─ Primary CTA Button (Configurable)                            │
│     ├─ Secondary CTA Button (Configurable)                          │
│     └─ Floating Hearts (Toggle)                                     │
└─────────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────────┐
│  2. TrustStrip                                                       │
│     Purpose: Reduce purchase friction                                │
│     Admin: Icons, titles, descriptions editable                      │
│     ├─ Gift Wrapped with Love                                       │
│     ├─ Fast Delivery                                                │
│     ├─ Easy Returns                                                 │
│     └─ Loved by 50,000+ Women                                       │
└─────────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────────┐
│  3. BrandStatement                                                   │
│     Purpose: Emotional brand positioning                             │
│     Admin: Quote text, heart divider toggle                         │
│     ├─ Heart Divider (Top)                                          │
│     ├─ Quote Text (Serif, italic, large)                            │
│     └─ Heart Divider (Bottom)                                       │
└─────────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────────┐
│  4. GiftByPriceHearts ⚡ CRITICAL FIX                               │
│     Purpose: Price-based product discovery                           │
│     Admin: Price tiers, labels, colors configurable                 │
│                                                                      │
│     Working Logic:                                                   │
│     ┌──────────────┐                                                │
│     │ Heart Clicked│                                                │
│     └──────┬───────┘                                                │
│            │                                                         │
│            ▼                                                         │
│     ┌─────────────────────┐                                         │
│     │ /collections?       │                                         │
│     │ maxPrice=1099       │                                         │
│     └──────┬──────────────┘                                         │
│            │                                                         │
│            ▼                                                         │
│     ┌────────────────────────┐                                      │
│     │ CollectionPageShell    │                                      │
│     │ Reads URL params       │                                      │
│     └──────┬─────────────────┘                                      │
│            │                                                         │
│            ▼                                                         │
│     ┌────────────────────────┐                                      │
│     │ API Request with       │                                      │
│     │ price filters          │                                      │
│     └──────┬─────────────────┘                                      │
│            │                                                         │
│            ▼                                                         │
│     ┌────────────────────────┐                                      │
│     │ Filtered Products      │                                      │
│     │ Displayed              │                                      │
│     └────────────────────────┘                                      │
│                                                                      │
│     4 Hearts:                                                        │
│     ├─ Under ₹1,099 (Little Love)                                  │
│     ├─ Under ₹2,099 (Signature Love)                               │
│     ├─ Under ₹3,099 (Grand Love)                                   │
│     └─ Premium (All Out Love)                                       │
└─────────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────────┐
│  5. ShopByCategory                                                   │
│     Purpose: Visual category browsing                                │
│     Admin: Images, titles, links configurable                       │
│     ├─ Necklaces (Image + Link)                                    │
│     ├─ Rings (Image + Link)                                        │
│     ├─ Bracelets (Image + Link)                                    │
│     ├─ Earrings (Image + Link)                                     │
│     └─ Tumblers (Image + Link)                                     │
└─────────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────────┐
│  6. CuratedProducts ⚡ CRITICAL FIX                                 │
│     Purpose: Featured product showcase                               │
│     Admin: Collection selectable OR specific products               │
│                                                                      │
│     Working Logic:                                                   │
│     ┌────────────────────────┐                                      │
│     │ Component Loads        │                                      │
│     └──────┬─────────────────┘                                      │
│            │                                                         │
│            ▼                                                         │
│     ┌────────────────────────┐                                      │
│     │ Fetch from API         │                                      │
│     │ /products?             │                                      │
│     │ collection=featured    │                                      │
│     └──────┬─────────────────┘                                      │
│            │                                                         │
│            ▼                                                         │
│     ┌────────────────────────┐                                      │
│     │ Real Product Data      │                                      │
│     └──────┬─────────────────┘                                      │
│            │                                                         │
│            ▼                                                         │
│     ┌────────────────────────┐                                      │
│     │ ProductCardProduction  │                                      │
│     │ - Add to Cart ✅       │                                      │
│     │ - Add to Wishlist ✅   │                                      │
│     │ - Quick View ✅        │                                      │
│     │ - Hover States ✅      │                                      │
│     └────────────────────────┘                                      │
│                                                                      │
│     Features:                                                        │
│     ├─ 8 Products (configurable)                                   │
│     ├─ Loading Skeletons                                           │
│     ├─ Empty State Handling                                        │
│     └─ View All CTA                                                │
└─────────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────────┐
│  7. VideoReelStrip                                                   │
│     Purpose: Instagram-style engagement                              │
│     Admin: Media uploadable, captions editable                      │
│     ├─ Auto-scroll (pausable on hover)                             │
│     ├─ 6+ Images/Videos                                            │
│     ├─ Overlay Text                                                │
│     └─ Click-through Links                                         │
└─────────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────────┐
│  8. ValentineCombos                                                  │
│     Purpose: AOV driver, combo sets                                  │
│     Admin: Combos, badges, pricing configurable                     │
│     ├─ Love Essentials (Best Value)                                │
│     ├─ Golden Hour Set (Gift Ready)                                │
│     └─ Ultimate Valentine Box (Limited)                            │
└─────────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────────┐
│  9. FinalCTA                                                         │
│     Purpose: Emotional conversion close                              │
│     Admin: Headline, CTA text & link editable                       │
│     ├─ Floating Hearts (Background)                                │
│     ├─ Headline (Large, serif)                                     │
│     ├─ CTA Button (Prominent)                                      │
│     └─ Tagline (Own · Radiate · Adorn)                            │
└─────────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────────┐
│  10. Newsletter                                                      │
│      Purpose: Email list building                                    │
│      Admin: Text editable, ESP integration                          │
│      ├─ Email Input (Validated)                                    │
│      ├─ Submit Button                                              │
│      ├─ Loading State                                              │
│      ├─ Success Message                                            │
│      └─ Error Handling                                             │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow Diagram

```
┌─────────────────┐
│   User Action   │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  Component Receives Event            │
│  (Click, Submit, etc.)               │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  Component Logic                     │
│  (Validation, Formatting)            │
└────────┬────────────────────────────┘
         │
         ├────────────────────────────┐
         │                            │
         ▼                            ▼
┌────────────────┐         ┌──────────────────┐
│  API Call      │         │  Route Change    │
│  (if needed)   │         │  (if navigation) │
└────────┬───────┘         └──────────┬───────┘
         │                            │
         ▼                            ▼
┌────────────────┐         ┌──────────────────┐
│  Backend       │         │  Next.js Router  │
│  Processing    │         └──────────┬───────┘
└────────┬───────┘                    │
         │                            │
         ▼                            ▼
┌────────────────┐         ┌──────────────────┐
│  Response      │         │  New Page        │
│  Received      │         │  Rendered        │
└────────┬───────┘         └──────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  State Update                        │
│  (Success/Error/Loading)             │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  UI Re-render                        │
│  (Show result to user)               │
└─────────────────────────────────────┘
```

---

## 🎯 Example: Price Heart Click Flow

```
User on Homepage
       │
       ▼
Clicks "Under ₹1,099" Heart
       │
       ▼
┌──────────────────────────────────────┐
│ GiftByPriceHearts Component          │
│ Generates URL:                        │
│ /collections?maxPrice=1099           │
└──────────┬───────────────────────────┘
           │
           ▼ (Router navigates)
┌──────────────────────────────────────┐
│ /collections page loads               │
│ (CollectionPageShell component)       │
└──────────┬───────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│ useSearchParams() reads URL:          │
│ maxPrice = "1099"                     │
└──────────┬───────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│ Initialize filters state:             │
│ priceRange = "500-1099"              │
└──────────┬───────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│ API Request:                          │
│ GET /products?                        │
│     maxPrice=1099                     │
└──────────┬───────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│ Backend filters products              │
│ Returns only products ≤ ₹1,099       │
└──────────┬───────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│ Products displayed                    │
│ Filter chip shows: "Under ₹1,099"   │
│ ✅ Price filtering working!          │
└──────────────────────────────────────┘
```

---

## 📦 File Structure

```
frontend/
├── src/
│   ├── app/
│   │   └── (store)/
│   │       └── page.tsx ⭐ Main Homepage
│   │
│   └── components/
│       └── home/
│           ├── HomeHero.tsx
│           ├── TrustStrip.tsx
│           ├── BrandStatement.tsx ⭐ NEW
│           ├── GiftByPriceHearts.tsx ⚡ FIXED
│           ├── ShopByCategory.tsx
│           ├── CuratedProducts.tsx ⭐ NEW
│           ├── VideoReelStrip.tsx
│           ├── ValentineCombos.tsx
│           ├── FinalCTA.tsx
│           └── Newsletter.tsx ⚡ UPDATED
│
└── docs/
    ├── ORA_HOMEPAGE_REDESIGN_COMPLETE.md ⭐
    ├── ORA_HOMEPAGE_ADMIN_GUIDE.md ⭐
    ├── ORA_HOMEPAGE_IMPLEMENTATION_SUMMARY.md ⭐
    └── ORA_HOMEPAGE_ARCHITECTURE.md ⭐ (This file)

⭐ = New or major update
⚡ = Critical fix
```

---

## 🔧 Component Props Architecture

```
┌─────────────────────────────────────────┐
│         Homepage Main Component          │
│         /app/(store)/page.tsx            │
└─────────────────┬───────────────────────┘
                  │
                  │ Props passed down ↓
                  │
    ┌─────────────┴─────────────┐
    │                           │
    ▼                           ▼
┌──────────────┐        ┌──────────────┐
│  Component   │        │  Component   │
│  Props       │        │  State       │
└──────┬───────┘        └──────┬───────┘
       │                       │
       ▼                       ▼
┌──────────────┐        ┌──────────────┐
│ Configurable │        │   Internal   │
│ from Admin   │        │   Logic      │
└──────────────┘        └──────────────┘

Example:
┌─────────────────────────────────┐
│ <HomeHero                        │
│   heroImage={adminConfig.image}  │ ← From admin
│   title={adminConfig.title}      │ ← From admin
│   primaryCTA={adminConfig.cta}   │ ← From admin
│ />                               │
└─────────────────────────────────┘
```

---

## 🎨 Design System Hierarchy

```
┌────────────────────────────────────────────────┐
│              Design Tokens                      │
└────────────────┬───────────────────────────────┘
                 │
        ┌────────┴────────┐
        │                 │
        ▼                 ▼
┌──────────────┐  ┌──────────────┐
│   Colors     │  │  Typography  │
│              │  │              │
│ #9B2C46      │  │ font-serif   │
│ #1A1A1A      │  │ font-sans    │
│ #FFE4EC      │  │              │
└──────────────┘  └──────────────┘
        │                 │
        ▼                 ▼
┌─────────────────────────────────┐
│        Components Use            │
└─────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────┐
│     Consistent UI/UX             │
└─────────────────────────────────┘
```

---

## 🔐 Admin Configuration Layer

```
┌──────────────────────────────────────────┐
│        Future: CMS Integration            │
│        (Shopify Metaobjects, etc.)       │
└───────────────┬──────────────────────────┘
                │
                ▼
┌──────────────────────────────────────────┐
│         Props Interface                   │
│         (Current Implementation)          │
└───────────────┬──────────────────────────┘
                │
                ▼
┌──────────────────────────────────────────┐
│         Components                        │
│         (Receive props)                   │
└───────────────┬──────────────────────────┘
                │
                ▼
┌──────────────────────────────────────────┐
│         Rendered UI                       │
│         (User sees)                       │
└──────────────────────────────────────────┘

Migration Path:
Current: Props in page.tsx
     ↓
Phase 2: Props from CMS API
     ↓
Phase 3: Visual page builder
```

---

## ✅ Quality Checklist

```
Architecture
  ├─ [x] Modular components
  ├─ [x] Single Responsibility Principle
  ├─ [x] Props-based configuration
  ├─ [x] Type-safe (TypeScript)
  ├─ [x] Reusable components
  └─ [x] Clean separation of concerns

Functionality
  ├─ [x] Price filtering works
  ├─ [x] Products load from API
  ├─ [x] All CTAs functional
  ├─ [x] Form validation
  ├─ [x] Error handling
  └─ [x] Loading states

Admin Control
  ├─ [x] All images configurable
  ├─ [x] All text editable
  ├─ [x] All links changeable
  ├─ [x] Product selection flexible
  └─ [x] Easy to update

Performance
  ├─ [x] Image optimization
  ├─ [x] Lazy loading
  ├─ [x] Code splitting
  ├─ [x] Fast build time
  └─ [x] SEO optimized

Quality
  ├─ [x] No TypeScript errors
  ├─ [x] Build successful
  ├─ [x] Mobile responsive
  ├─ [x] Accessible
  └─ [x] Well documented
```

---

## 🚀 Deployment Ready

```
┌──────────────┐
│  Development │
│   Complete   │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│    Build     │
│  Successful  │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   Testing    │
│   Passed     │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Documentation│
│   Complete   │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  READY FOR   │
│  PRODUCTION  │
│      🚀      │
└──────────────┘
```

---

**Architecture Version:** 1.0  
**Status:** ✅ Production Ready  
**Last Updated:** February 11, 2026
