# 🎨 ORA Jewellery — Image & Banner Design Specifications

> **For designers editing in Canva / Photoshop / Figma**
> All dimensions are at **72 DPI** (web standard). For **print quality**, use 300 DPI and multiply cm/inches accordingly.

---

## 📐 Quick Reference — All Sizes

| # | Element | Desktop (px) | Mobile (px) | Aspect Ratio | Desktop (cm) | Desktop (inches) | Mobile (cm) | Mobile (inches) |
|---|---------|-------------|-------------|--------------|--------------|-------------------|-------------|-----------------|
| 1 | Home Hero Banner | 1920 × 800 | 750 × 1000 | 12:5 / 3:4 | 67.7 × 28.2 | 26.7 × 11.1 | 26.5 × 35.3 | 10.4 × 13.9 |
| 2 | Home Hero Carousel | 1920 × 680 | 750 × 1000 | ~2.8:1 / 3:4 | 67.7 × 24.0 | 26.7 × 9.4 | 26.5 × 35.3 | 10.4 × 13.9 |
| 3 | Shop All Hero | 1920 × 850 | 750 × 1000 | ~2.3:1 / 3:4 | 67.7 × 30.0 | 26.7 × 11.8 | 26.5 × 35.3 | 10.4 × 13.9 |
| 4 | Promo Banner (in-grid) | 1400 × 400 | 750 × 215 | 3.5:1 / 3.5:1 | 49.4 × 14.1 | 19.4 × 5.6 | 26.5 × 7.6 | 10.4 × 3.0 |
| 5 | Video Reel / Story Card | 280 × 497 | 200 × 356 | 9:16 | 9.9 × 17.5 | 3.9 × 6.9 | 7.1 × 12.6 | 2.8 × 4.9 |
| 6 | Mood Card (Shop by Mood) | 240 × 320 | 200 × 267 | 3:4 | 8.5 × 11.3 | 3.3 × 4.4 | 7.1 × 9.4 | 2.8 × 3.7 |
| 7 | Product Card Image | 600 × 800 | 375 × 500 | 3:4 | 21.2 × 28.2 | 8.3 × 11.1 | 13.2 × 17.6 | 5.2 × 6.9 |
| 8 | Product Card (Home) | 600 × 750 | 375 × 469 | 4:5 | 21.2 × 26.5 | 8.3 × 10.4 | 13.2 × 16.5 | 5.2 × 6.5 |
| 9 | Product Detail Main | 800 × 800 | 750 × 750 | 1:1 (square) | 28.2 × 28.2 | 11.1 × 11.1 | 26.5 × 26.5 | 10.4 × 10.4 |
| 10 | Gift Product Card | 600 × 600 | 375 × 375 | 1:1 (square) | 21.2 × 21.2 | 8.3 × 8.3 | 13.2 × 13.2 | 5.2 × 5.2 |
| 11 | Combo Card | 600 × 450 | 375 × 281 | 4:3 | 21.2 × 15.9 | 8.3 × 6.3 | 13.2 × 9.9 | 5.2 × 3.9 |
| 12 | Category Banner | 1400 × 280 | 750 × 150 | 5:1 / 5:1 | 49.4 × 9.9 | 19.4 × 3.9 | 26.5 × 5.3 | 10.4 × 2.1 |

---

## 1️⃣ Home Hero Banner (`HomeHero.tsx`)

**Where it appears:** Homepage — first thing visitors see, full-screen hero.

| Property | Value |
|----------|-------|
| **Desktop size** | **1920 × 800 px** (67.7 × 28.2 cm / 26.7 × 11.1 inches) |
| **Mobile size** | **750 × 1000 px** (26.5 × 35.3 cm / 10.4 × 13.9 inches) |
| **Aspect ratio** | Desktop: **12:5** (wide landscape) / Mobile: **3:4** (tall portrait) |
| **File format** | `.jpg` or `.webp` (recommended) |
| **Max file size** | 500 KB (desktop), 300 KB (mobile) |
| **Section height** | 100vh (full screen, max 900px) |
| **Safe zone** | Keep text/logos in center 60% — edges will be cropped on different screens |

**Canva template:** Custom size → **1920 × 800 px** (desktop) / **750 × 1000 px** (mobile)

> **⚠️ Also supports video:** MP4, max 10MB, same dimensions. Use hero image as the video poster/thumbnail.

### Design tips:
- Image has a dark gradient overlay (top: 10%, middle: 30%, bottom: 55% opacity) — so light-colored images work fine
- Text overlay is centered — keep the main visual interest off-center
- Use high-quality lifestyle/jewellery shots
- Mobile version is cropped from center — don't put important elements at edges

---

## 2️⃣ Home Hero Carousel (`LuxuryHero.tsx`)

**Where it appears:** Homepage — auto-advancing carousel with 4 slides (5-second interval).

| Property | Value |
|----------|-------|
| **Desktop size** | **1920 × 680 px** (67.7 × 24.0 cm / 26.7 × 9.4 inches) |
| **Mobile size** | **750 × 1000 px** (26.5 × 35.3 cm / 10.4 × 13.9 inches) |
| **Aspect ratio** | Desktop: **~2.8:1** / Mobile: **3:4** |
| **Section height** | 65vh (min 420px, max 680px) |
| **File format** | `.jpg` or `.webp` |
| **Max file size** | 400 KB per slide |

**Canva template:** Custom size → **1920 × 680 px**

### Current slides to edit:
1. `banners.png` — Main hero ("Own. Radiate. Adorn.")
2. `chain.jpeg` — Necklaces slide
3. `ring.jpeg` — Rings slide
4. `bracelets.jpeg` — Bracelets slide

**File location:** `/frontend/public/` — replace files with same name, or update in `LuxuryHero.tsx`

---

## 3️⃣ Shop All / Collections Hero (`LuxuryHeroSection.tsx`)

**Where it appears:** `/collections` page — the main shop page hero.

| Property | Value |
|----------|-------|
| **Desktop size** | **1920 × 850 px** (67.7 × 30.0 cm / 26.7 × 11.8 inches) |
| **Mobile size** | **750 × 1000 px** (26.5 × 35.3 cm / 10.4 × 13.9 inches) |
| **Aspect ratio** | Desktop: **~2.3:1** / Mobile: **3:4** |
| **Section height** | 75vh desktop, 85vh mobile |
| **Upload via** | Admin Panel → Content → Hero Sliders |

> Also supports looping video (MP4, muted, autoplay).

**Admin recommended size noted:** 1920×800px desktop, 750×1000px mobile

---

## 4️⃣ Promotional Banner (In-Grid) (`LuxuryPromoBanner.tsx`)

**Where it appears:** Inserted between product rows on the collections/shop page.

| Property | Value |
|----------|-------|
| **Desktop size** | **1400 × 280 px** (49.4 × 9.9 cm / 19.4 × 3.9 inches) — aspect 5:1 |
| **Mobile size** | **750 × 215 px** (26.5 × 7.6 cm / 10.4 × 3.0 inches) — aspect 3.5:1 |
| **Aspect ratio** | Mobile: **3.5:1** / Desktop: **5:1** |
| **File format** | `.jpg` or `.webp` |
| **Upload via** | Admin Panel → Shop All CMS → Promo Banners |

**Canva template:** Custom size → **1400 × 280 px** (desktop)

### Design tips:
- Has a dark left-to-right gradient overlay — place key visuals on the RIGHT side
- Text appears left-aligned over the banner
- Keep it clean — one message, one CTA
- Great for: "New Collection", "Free Shipping", "Sale 20% Off"

---

## 5️⃣ Video Reel / Story Cards (`VideoReelStrip.tsx`)

**Where it appears:** Homepage — horizontal auto-scrolling strip ("The ORA Life" section).

| Property | Value |
|----------|-------|
| **Card size** | **280 × 497 px** (9.9 × 17.5 cm / 3.9 × 6.9 inches) |
| **Mobile card** | **200 × 356 px** (7.1 × 12.6 cm / 2.8 × 4.9 inches) |
| **Aspect ratio** | **9:16** (Instagram Reel / Story format!) |
| **File format** | `.jpg`, `.webp`, or `.mp4` (for video) |
| **Max file size** | 200 KB (image), 5 MB (video) |

**Canva template:** **Instagram Story** (1080 × 1920 px) — will be auto-scaled down

### Current reels to edit:
1. `chain.jpeg` — "Layer It Your Way"
2. `ring.jpeg` — "Styled Every Day"
3. `bracelets.jpeg` — "Made for Her"
4. `banners.png` — "Everyday Luxury"
5–8: Duplicates of above with different overlay text

**File location:** `/frontend/public/` — replace or update in `VideoReelStrip.tsx`

### Design tips:
- Dark background section (black) — images should be vibrant/bright
- Bottom gradient overlay (70% black) — dark area at bottom holds the text
- Portrait orientation only (9:16)
- Perfect for: behind-the-scenes, styling tips, close-up product shots
- **To use videos:** Change `type: 'image'` to `type: 'video'` in the component

---

## 6️⃣ Mood / Story Cards (`MoodStoryStrip.tsx`)

**Where it appears:** Shop All page — "Shop by Mood" horizontal scroll section.

| Property | Value |
|----------|-------|
| **Card size** | **240 × 320 px** (8.5 × 11.3 cm / 3.3 × 4.4 inches) |
| **Mobile card** | **200 × 267 px** (7.1 × 9.4 cm / 2.8 × 3.7 inches) |
| **Aspect ratio** | **3:4** (portrait) |
| **File format** | `.jpg` or `.webp` |
| **Upload via** | Admin Panel → Shop All CMS → Mood Strip |

**Canva template:** Custom size → **720 × 960 px** (3× for sharp display)

### Design tips:
- Bottom gradient overlay — dark at bottom for text readability
- Lifestyle/mood imagery works best (not product-on-white)
- Example moods: "Everyday Elegance", "Date Night Glow", "Office Chic", "Gift Edit"

---

## 7️⃣ Product Card Image (Collections Grid)

**Where it appears:** Product grid on `/collections`, search results, category pages.

| Card Style | Size (px) | Aspect Ratio | cm | inches |
|------------|-----------|--------------|-----|--------|
| **Luxury Grid (v2)** | **600 × 800** | **3:4** | 21.2 × 28.2 | 8.3 × 11.1 |
| **Home Bestsellers/New Arrivals** | **600 × 750** | **4:5** | 21.2 × 26.5 | 8.3 × 10.4 |
| **Gift Cards** | **600 × 600** | **1:1** | 21.2 × 21.2 | 8.3 × 8.3 |
| **Combo Cards** | **600 × 450** | **4:3** | 21.2 × 15.9 | 8.3 × 6.3 |

**Upload via:** Admin Panel → Products → Edit Product → Images

### Product photography guidelines:
- **Primary image:** Clean white/light background, product centered
- **Hover image:** Model wearing / lifestyle shot / alternate angle
- Minimum **600px wide** (800px+ recommended for retina)
- File format: `.webp` preferred (smallest size), `.jpg` acceptable
- Max file size: 300 KB per image
- The backend auto-generates optimized versions (thumbnail, listing, hero)

---

## 8️⃣ Product Detail Main Image

**Where it appears:** Product detail page — large zoomable image.

| Property | Value |
|----------|-------|
| **Size** | **800 × 800 px** minimum (1200 × 1200 px recommended) |
| **Aspect ratio** | **1:1** (square) |
| **File format** | `.webp` or `.jpg` |
| **Max file size** | 500 KB |

### Tips:
- Upload multiple images (front, back, detail, on-model)
- First image = main display image
- Images are shown in a swipeable gallery on mobile

---

## 9️⃣ Category / Collection Banner

**Where it appears:** Top of category pages (e.g., `/collections/necklaces`)

| Property | Value |
|----------|-------|
| **Desktop size** | **1400 × 280 px** (49.4 × 9.9 cm / 19.4 × 3.9 inches) |
| **Mobile size** | **750 × 150 px** (26.5 × 5.3 cm / 10.4 × 2.1 inches) |
| **Aspect ratio** | **5:1** |
| **Upload via** | Admin → Content → Banners → Category type |

---

## 🔁 Hero Slider (Admin-Managed)

**Where it appears:** Homepage carousel (managed from Admin panel)

| Property | Value |
|----------|-------|
| **Desktop** | **1920 × 800 px** |
| **Mobile** | **750 × 1000 px** |
| **Upload via** | Admin Panel → Content → Hero Sliders |
| **Recommended** | 3-5 slides max, auto-rotate every 5 seconds |

---

## 📱 Social Media Export Sizes (Bonus)

If you're creating matching social posts from the same imagery:

| Platform | Size (px) | Canva Template |
|----------|-----------|----------------|
| Instagram Post | 1080 × 1080 | Instagram Post |
| Instagram Story/Reel | 1080 × 1920 | Instagram Story |
| Facebook Cover | 820 × 312 | Facebook Cover |
| WhatsApp Status | 1080 × 1920 | Instagram Story |
| Website OG Image | 1200 × 630 | Custom |

---

## 🎨 Brand Color Reference

| Color | Hex | Usage |
|-------|-----|-------|
| Rose Gold (Primary) | `#B76E79` | Buttons, accents, headers |
| Rose Gold Light | `#E8B4B8` | Soft backgrounds |
| Rose Gold Pink | `#F8C8DC` | Cards, badges |
| Black | `#1A1A1A` | Text, CTA buttons |
| Gold Accent | `#D4AF37` | Premium badges, highlights |
| Cream Background | `#FFF5F7` | Page backgrounds |
| Soft Pink | `#FFE8EF` | Section backgrounds |

---

## 📂 File Locations

| What | Where to Replace |
|------|-----------------|
| Home hero images | `/frontend/public/banners.png`, `chain.jpeg`, `ring.jpeg`, `bracelets.jpeg` |
| Reel strip images | Same as above (reuses product images) |
| Hero slides (CMS) | Admin Panel → Content → Hero Sliders → Upload |
| Promo banners (CMS) | Admin Panel → Shop All CMS → Promo Banners |
| Mood cards (CMS) | Admin Panel → Shop All CMS → Mood Strip |
| Product images | Admin Panel → Products → Edit → Images |
| Category banners | Admin Panel → Content → Banners → Category |

---

## ✅ Checklist Before Uploading

- [ ] Exported at correct pixel dimensions (see table above)
- [ ] File format: `.webp` preferred, `.jpg` acceptable
- [ ] File size under the recommended limit (compress with TinyPNG or Squoosh.app)
- [ ] Mobile version prepared (portrait 3:4) for heroes
- [ ] Text/logos within the center safe zone (edges may crop)
- [ ] Preview on mobile (Chrome DevTools → responsive mode)

---

*Last updated: March 2026 | ORA Jewellery Design Team*
