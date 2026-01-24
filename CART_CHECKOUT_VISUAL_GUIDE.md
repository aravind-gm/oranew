# 🎨 CART & CHECKOUT — VISUAL ARCHITECTURE

## CART PAGE (`/cart`) — LIVE INVOICE VIEW

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Your Order                                                 │
│  Review before checkout                                     │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Cart — Address — Payment                                   │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Items (3)                                                  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ [IMG] Diamond Ring               Qty:1    ₹45,000  │   │
│  │       Available in stock                            │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ [IMG] Gold Bracelet              Qty:2    ₹28,000  │   │
│  │       5 in stock                                    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ [IMG] Pearl Necklace             Qty:1    ₹12,500  │   │
│  │       3 in stock                                    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Subtotal                              ₹85,500            │
│  Shipping                              Free               │
│  Tax                                   Included           │
│  ───────────────────────────────────────────────────      │
│  Total                                 ₹85,500            │
│                                                             │
│  [Continue to Secure Checkout]                             │
│                                                             │
│  Secure checkout • Free shipping above ₹999                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Key Elements:
- ✅ **Invoice rows** (not cards) — minimal visual weight
- ✅ **Inline quantity editor** — text input with +/- buttons
- ✅ **Real-time price updates** — Framer Motion animations
- ✅ **Receipt-style breakdown** — no boxes, thin dividers
- ✅ **System stepper** — progress indicator only
- ✅ **Single CTA** — "Continue to Secure Checkout"

---

## CHECKOUT PAGE (`/checkout`) — PROGRESSIVE FLOW

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  Secure Checkout                                        │
│  Complete your order                                    │
│                                                         │
│  Cart — Address — Payment                               │
│                                                         │
├─────────────────────────┬───────────────────────────────┤
│                         │                               │
│ ▼ CONTACT & ADDRESS     │  Order Summary                │
│   ✓ (completed)         │                               │
│                         │  Diamond Ring          ₹45,000│
│   Street Address        │  Qty: 1                       │
│   [____________]        │                               │
│                         │  Gold Bracelet         ₹14,000│
│   City        State     │  Qty: 2                       │
│   [____]      [____]    │                               │
│                         │  Pearl Necklace        ₹12,500│
│   ZIP Code    Country   │  Qty: 1                       │
│   [____]      [India]   │                               │
│                         │  ─────────────────────────    │
│   [Continue to Delivery]│  Subtotal         ₹85,500    │
│                         │  Shipping         Free        │
├─────────────────────────│  Tax              Included    │
│                         │  Total            ₹85,500    │
│ ▼ DELIVERY CONFIRMATION │                               │
│   ✓ (completed)         │                               │
│                         │                               │
│   Shipping to:          │                               │
│   123 Main Street       │                               │
│   Mumbai, Maharashtra   │                               │
│   400001, India         │                               │
│   [Edit address]        │                               │
│                         │                               │
│   [Confirm Delivery]    │                               │
│                         │                               │
├─────────────────────────┤                               │
│                         │                               │
│ ▼ PAYMENT               │                               │
│   (active)              │                               │
│                         │                               │
│   ☑ Razorpay            │                               │
│     Card, UPI, Nets...  │                               │
│                         │                               │
│   [🔒 Place Secure Order]                              │
│                         │                               │
│   Your payment info is  │                               │
│   encrypted & secure    │                               │
│                         │                               │
└─────────────────────────┴───────────────────────────────┘
```

### Key Features:

**Progressive Disclosure**
- One section expanded at a time
- Smooth expand/collapse animations
- Completion checkmarks on finished sections
- Auto-advancement on completion

**Section States**
1. **Contact & Address** — Form inputs (street, city, state, ZIP, country)
2. **Delivery Confirmation** — Receipt-style address display with edit option
3. **Payment** — Radio option for Razorpay, final CTA

**Right Sidebar**
- Order summary (items preview)
- Pricing breakdown (matches cart style)
- Sticky on desktop, responsive on mobile

---

## COMPONENT HIERARCHY

### Cart Page Components
```
CartPage
├── SystemStepper (Cart — Address — Payment)
├── Stock Error Alert (conditional)
├── Invoice Rows Section
│   ├── QuantityEditor (inline, per item)
│   ├── AnimatedPrice (per item)
│   └── Remove Button (per item)
├── Smart Bill Breakdown
│   ├── Subtotal (animated)
│   ├── Shipping (animated)
│   ├── Tax (animated)
│   └── Total (prominent, animated)
└── Primary CTA + Trust Line
```

### Checkout Page Components
```
CheckoutPage
├── SystemStepper (Cart — Address — Payment)
├── Error Alert (conditional)
├── Main Grid (2-column: forms + sidebar)
│   ├── Left Column
│   │   ├── CollapsibleSection #1: Contact & Address
│   │   │   ├── Street input
│   │   │   ├── City input
│   │   │   ├── State input
│   │   │   ├── ZIP Code input
│   │   │   ├── Country select
│   │   │   └── Continue button
│   │   ├── CollapsibleSection #2: Delivery
│   │   │   ├── Address receipt display
│   │   │   ├── Edit button
│   │   │   └── Confirm button
│   │   └── CollapsibleSection #3: Payment
│   │       ├── Razorpay radio option
│   │       ├── Place Order button
│   │       └── Trust message
│   └── Right Column (Sidebar)
│       ├── Order Summary Header
│       ├── Items Preview
│       ├── Pricing Breakdown
│       └── Total
```

---

## ANIMATION GUIDE

### Framer Motion Usage

**Price Updates (Cart & Checkout)**
```typescript
<AnimatedPrice 
  value={total}
  className="text-lg font-medium"
/>

// Motion spec:
{
  initial: { opacity: 0, y: -4 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3, ease: 'easeOut' }
}
```

**Row Highlight (Cart)**
```typescript
animate={{ 
  backgroundColor: highlightedItem === productId 
    ? 'rgba(255, 214, 232, 0.15)' 
    : 'transparent'
}}
transition={{ duration: 0.3 }}
```

**Section Expand/Collapse (Checkout)**
```typescript
{
  initial: { height: 0, opacity: 0 },
  animate: { height: 'auto', opacity: 1 },
  exit: { height: 0, opacity: 0 },
  transition: { duration: 0.3, ease: 'easeInOut' }
}
```

---

## COLOR & TYPOGRAPHY USAGE

### Colors (from Tailwind config)
- **Primary Text** — `#2D2D2D` (text-primary)
- **Secondary Text** — `#6B6B6B` (text-secondary)
- **Muted Text** — `#A0A0A0` (text-muted)
- **Background** — `#FDFBF7` (background)
- **Primary Color** — `#FFD6E8` (baby pink)
- **Accent** — `#D4AF77` (muted gold)
- **Error** — `#D88B8B`
- **Success** — `#A8D5BA`
- **Border** — `#E8E8E8`

### Typography
- **Headers** — Serif font (Cormorant Garamond)
- **Body** — Sans font (Inter, Montserrat)
- **Numbers** — Right-aligned, consistent formatting

### Spacing
- Form fields: 4 (px-4 py-3)
- Section padding: 6 (pb-6)
- Main container: px-6 py-12 lg:py-16

---

## RESPONSIVE BEHAVIOR

### Breakpoints

**Mobile (default)**
- Single column layout
- Full-width inputs and buttons
- Stacked form fields
- Sidebar below content

**Tablet/Desktop (lg: breakpoint)**
- Cart: Centered single column (max-w-4xl)
- Checkout: 2-column layout (main + sticky sidebar)
- Inputs: 2-column grids for address
- Sidebar sticky positioning (top-24)

---

## USER INTERACTIONS

### Cart Interactions
1. **Hover on row** → subtle background highlight (primary/5)
2. **Click quantity** → text input appears, border visible
3. **Edit quantity** → price updates instantly, row briefly highlights pink
4. **Click remove** → item fades out, totals recalculate
5. **Click checkout** → validation → redirect if auth OK

### Checkout Interactions
1. **Click section** → if available, expands with animation
2. **Type in inputs** → realtime, no submit needed
3. **Click Continue** → validates, marks complete, next section unlocks
4. **Edit address** → collapses current, goes back to address section
5. **Select payment** → enables final button
6. **Click Place Order** → shows loading, creates order, redirects

---

## ERROR HANDLING

### Cart Page
- **Stock Issues** — Red alert box at top
- **Checkout Disabled** — Button disabled if stock problems exist

### Checkout Page
- **Validation Error** — "Please fill in all address fields"
- **API Error** — Full error message in red box
- **Network Error** — "Server error occurred"

---

## ACCESSIBILITY

### Keyboard Navigation
- All buttons: accessible via Tab key
- Form inputs: Tab order follows visual flow
- Links: standard focus outlines

### Screen Readers
- ARIA labels on inputs
- "aria-label" on icon buttons
- Semantic HTML (button, form, input)

### Focus States
- Input focus: `focus:border-text-primary`
- Button focus: hover state applied
- Visible focus indicators throughout

---

## PERFORMANCE NOTES

- **No images below fold** — products loaded only when visible
- **Lazy animations** — Framer Motion optimized
- **Grid layout** — hardware accelerated
- **Minimal repaints** — only prices animate
- **Bundle size** — no new libraries

---

_This visual guide serves as a reference for understanding the rebuilt cart and checkout experience. Every element has been carefully designed to reflect premium, system-first principles._
