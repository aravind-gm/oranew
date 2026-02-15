# ORA Homepage Admin Quick Reference

## 🎯 How to Update Homepage Content

This guide is for non-technical admins who need to update homepage content.

---

## 📝 What Can Be Changed?

Everything! Here's what you can control:

### 1. Hero Section (Top Banner)
- **Desktop Image:** Upload high-res image (1920x1080px recommended)
- **Mobile Image:** Upload mobile-optimized image (750x1334px recommended)
- **Headline:** "Own. Radiate. Adorn." (editable)
- **Subtitle:** Short description text (editable)
- **Primary Button:** Text + Link (e.g., "Shop Collection" → /collections)
- **Secondary Button:** Text + Link (e.g., "Valentine Special" → /valentine)

### 2. Trust Icons (Below Hero)
- **4 Trust Points:** Each has:
  - Icon (uploadable)
  - Title (editable)
  - Description (editable)

### 3. Brand Statement (Quote Section)
- **Quote Text:** Main quote (editable)
- **Heart Divider:** Show/Hide toggle

### 4. Gift by Heart (Price Filters) ⚡
- **4 Price Tiers:** Each has:
  - Label (e.g., "Under ₹1,099")
  - Subtitle (e.g., "Little Love")
  - Price Limit (editable)
  - Heart Color (editable)

**Two Options:**
- **Option A:** Auto-filter by price (recommended, already working)
- **Option B:** Link to Shopify collections (requires setup)

### 5. Shop by Category
- **5 Category Cards:** Each has:
  - Image (uploadable)
  - Title (editable)
  - Subtitle (editable)
  - Collection Link (selectable)

### 6. Curated Products ⚡
**Two Ways to Manage:**

**Option A: Collection-Based (Easiest)**
1. Create a collection in Shopify named "featured"
2. Add products to that collection
3. Homepage automatically displays them
4. Update collection → Homepage updates

**Option B: Specific Products**
1. Select specific product IDs
2. Homepage shows only those products
3. More control, but manual updates needed

### 7. The ORA Life (Instagram-Style)
- **Reel Items:** Each has:
  - Image or Video (uploadable)
  - Caption Text (editable)
  - Link (optional)

### 8. Valentine Combos
- **Combo Cards:** Each has:
  - Image (uploadable)
  - Title (editable)
  - Description (editable)
  - Price (editable)
  - Badge (e.g., "Best Value")

### 9. Final CTA
- **Headline:** "Make every moment unforgettable." (editable)
- **Button Text:** "Shop ORA" (editable)
- **Button Link:** /collections (editable)

### 10. Newsletter
- **Heading:** "Stay Connected" (editable)
- **Subheading:** Description text (editable)
- **Form:** Email capture (automatic)

---

## 🚀 Quick Update Guide

### To Change Hero Image:
1. Upload new image to Shopify
2. Update `heroImage` prop in page.tsx
3. Deploy changes

### To Update Curated Products:
**Easy Method:**
1. Go to Shopify Admin
2. Navigate to Products → Collections
3. Find or create "featured" collection
4. Add/remove products
5. Save
6. Homepage updates automatically!

**Manual Method:**
1. Note product IDs you want to feature
2. Update `productIds` prop in page.tsx
3. Deploy changes

### To Change Price Heart Tiers:
1. Edit the price values in GiftByPriceHearts component
2. Or create Shopify collections:
   - Name: "under-1099"
   - Filter: Price < ₹1,099
3. Products auto-filter when hearts clicked

---

## 🎨 Image Specifications

### Required Images:

| Section | Size | Format | Notes |
|---------|------|--------|-------|
| Hero Desktop | 1920x1080px | JPG/PNG | High quality |
| Hero Mobile | 750x1334px | JPG/PNG | Portrait |
| Categories (5) | 800x800px | JPG/PNG | Square |
| Lifestyle Reel (6+) | 600x800px | JPG/MP4 | Portrait |
| Combos (3+) | 800x600px | JPG/PNG | Landscape |

### Image Guidelines:
- ✅ Women-only imagery
- ✅ Premium, lifestyle shots
- ✅ Good lighting
- ✅ No text overlays (we add in code)
- ❌ No men
- ❌ No couples
- ❌ No stock watermarks

---

## ⚠️ Important Rules

### DO:
✅ Test on mobile after changes
✅ Use high-quality images
✅ Keep text concise
✅ Update regularly for freshness
✅ Check all links work

### DON'T:
❌ Use low-res images
❌ Hardcode product names
❌ Use placeholder text
❌ Break existing links
❌ Forget mobile testing

---

## 🔧 Common Tasks

### Task: Add New Valentine Product to Homepage
**Steps:**
1. Add product to Shopify
2. Add to "featured" collection
3. Done! It appears automatically

### Task: Change Hero CTA Button
**Steps:**
1. Find `primaryCTA` in page.tsx
2. Update label and href
3. Deploy

### Task: Update Trust Icons
**Steps:**
1. Find `TrustStrip` in page.tsx
2. Update icon, title, description
3. Deploy

### Task: Create Price-Based Collection
**Steps:**
1. Shopify Admin → Products → Collections
2. Create new collection
3. Name: "under-1099"
4. Add filter: Price < ₹1,099
5. Save
6. Update GiftByPriceHearts to use smart collections

---

## 📞 Need Help?

### Quick Fixes:
- **Image not showing:** Check file path and upload
- **Link broken:** Verify destination page exists
- **Products not loading:** Check collection name
- **Price filter not working:** Verify collection exists

### Developer Contact:
For technical issues, contact your development team with:
- Screenshot of issue
- What you changed
- Expected vs actual behavior

---

## 🎯 Best Practices

### Content Updates:
- **Seasonality:** Update hero for holidays/events
- **Fresh Products:** Rotate curated products weekly
- **Testing:** Always preview before publishing
- **Mobile First:** Check mobile view immediately

### SEO:
- Use descriptive alt text for images
- Keep headlines clear and keyword-rich
- Update meta descriptions when hero changes

---

## ✅ Pre-Launch Checklist

Before going live, verify:
- [ ] All hero images uploaded
- [ ] All CTAs link correctly
- [ ] Curated products showing
- [ ] Price hearts filter products
- [ ] Mobile view looks good
- [ ] Newsletter form works
- [ ] All images have alt text
- [ ] No placeholder text visible
- [ ] Footer links work
- [ ] Test add-to-cart

---

## 📊 Monitoring

### What to Track:
- Which price hearts get most clicks
- Newsletter signup rate
- Curated products performance
- CTA click-through rates
- Mobile vs desktop traffic

### Weekly Tasks:
- Check curated products still relevant
- Review seasonal imagery
- Test all CTAs
- Monitor newsletter signups

---

## 🚨 Troubleshooting

### "Price heart doesn't filter"
**Fix:** Ensure collection exists or URL params are correct

### "Curated products not showing"
**Fix:** Check "featured" collection has products

### "Image not loading"
**Fix:** Verify image uploaded and path correct

### "Mobile looks broken"
**Fix:** Clear cache and test in incognito

---

## 🎉 You're Ready!

The homepage is now fully under your control. Update content regularly to keep it fresh and engaging!

**Remember:**
- Everything is configurable
- Changes are safe (version controlled)
- Mobile-first always
- Test before publishing

Happy updating! 💝

---

**Guide Version:** 1.0  
**For:** ORA Admin Team  
**Last Updated:** February 11, 2026
