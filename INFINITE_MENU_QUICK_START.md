# Quick Start: Infinite Menu Integration

## ✅ What's Done

Your Infinite Menu component is now fully integrated into your home page with:

✓ Complete WebGL 3D interactive component  
✓ ORA brand color theme (Pink #FFD6E8, Gold #D4AF77, Charcoal #2D2D2D)  
✓ Responsive design for desktop, tablet, and mobile  
✓ 4 jewelry collection items with images from `/public/infinte menu/`  
✓ Smooth animations and transitions  
✓ Touch-enabled controls  

## 🚀 Get Started in 3 Steps

### Step 1: Install Dependencies
```bash
cd frontend
pnpm install
```

### Step 2: Run Development Server
```bash
pnpm dev
```

### Step 3: View the Component
Open http://localhost:3000 and scroll down to "Explore Our Collections" section (after "New Arrivals")

## 📍 Location on Home Page

The Infinite Menu appears between:
- **Before**: New Arrivals Section
- **After**: 20% Off Promo Banner

## 🎨 What You Get

### Interactive Features
- **Drag & Rotate**: Click and drag on the canvas to rotate the 3D sphere
- **Auto-Snap**: Release mouse to snap to nearest collection
- **Live Preview**: Active collection title, description, and action button animate in/out
- **Mobile Touch**: Full touch support on mobile devices

### Collections Displayed
1. **Necklaces** - Elegant necklaces for every occasion
2. **Bracelets** - Delicate bracelets with timeless appeal
3. **Rings** - Statement rings that define style
4. **Earrings** - Sophisticated earrings for every look

## 🎯 Next: Customize

### Change Which Images Display
Edit [src/app/page.tsx](src/app/page.tsx) line ~95:

```tsx
<InfiniteMenu 
  items={[
    {
      image: '/infinte menu/your-image.webp',  // Path to image
      link: '/products',                         // Where it links
      title: 'Your Title',                       // Collection name
      description: 'Your description'            // Brief description
    }
    // Add more items...
  ]}
  scale={2.6}  // Zoom level (1-3)
/>
```

### Adjust the Zoom Level
```tsx
<InfiniteMenu scale={3.0} />  // More zoomed in
<InfiniteMenu scale={1.5} />  // More zoomed out
<InfiniteMenu scale={2.6} />  // Current (recommended)
```

### Change Button Colors
Edit [src/components/home/InfiniteMenu.css](src/components/home/InfiniteMenu.css) line ~99:

```css
.infinite-menu-button {
  background: linear-gradient(135deg, #FFD6E8 0%, #FFC0DB 100%); /* Pink gradient */
  border: 3px solid #2D2D2D;                                      /* Black border */
}
```

## 📦 Files Added/Modified

### New Files (Created)
- `src/components/home/InfiniteMenu.tsx` - Main React component with WebGL
- `src/components/home/InfiniteMenu.css` - Component styling
- `INFINITE_MENU_INTEGRATION.md` - Detailed documentation

### Modified Files
- `src/app/page.tsx` - Added import and section
- `package.json` - Added `gl-matrix` dependency

## 🧪 Testing Checklist

- [ ] Run `pnpm dev` and server starts without errors
- [ ] Navigate to home page
- [ ] See "Explore Our Collections" section after New Arrivals
- [ ] Click and drag to rotate the 3D sphere
- [ ] Collection info appears/disappears smoothly
- [ ] Click center button to navigate (or logs message)
- [ ] Responsive on mobile (try different screen sizes)
- [ ] Images load correctly

## ⚙️ Troubleshooting

**WebGL Error?**
→ Check browser console (F12), ensure WebGL 2 support

**Images not showing?**
→ Verify paths: `/infinte menu/filename.webp` (note: folder has space)

**Button click not working?**
→ Update `handleButtonClick()` in InfiniteMenu.tsx with your router logic

**Performance lag?**
→ Reduce number of items or use WebP images

## 📚 Need More Details?

Read the full documentation: [INFINITE_MENU_INTEGRATION.md](INFINITE_MENU_INTEGRATION.md)

---

**Status**: ✅ Ready to Use  
**Version**: 1.0  
**Last Updated**: January 21, 2026
