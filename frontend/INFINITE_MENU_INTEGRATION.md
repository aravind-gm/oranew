# Infinite Menu Integration Guide

## Overview
The Infinite Menu has been successfully integrated into your ORA home page after the "New Arrivals" section. This interactive 3D component allows users to explore collections by rotating through beautifully displayed jewelry items.

## What Was Added

### 1. **New Component Files**
- **[src/components/home/InfiniteMenu.tsx](src/components/home/InfiniteMenu.tsx)** - Main React component with WebGL rendering
- **[src/components/home/InfiniteMenu.css](src/components/home/InfiniteMenu.css)** - Styled with ORA brand colors

### 2. **Updated Files**
- **[src/app/page.tsx](src/app/page.tsx)** - Imported InfiniteMenu and added it to home page layout
- **[package.json](package.json)** - Added `gl-matrix` dependency

### 3. **Color Theme Alignment**
The component uses ORA's complete brand color system:
- **Primary**: Blush Pink (#FFD6E8)
- **Text**: Charcoal (#2D2D2D)
- **Accent**: Muted Gold (#D4AF77)
- **Background**: Ivory (#FDFBF7)

## Installation & Setup

### Step 1: Install Dependencies
```bash
cd frontend
pnpm install
# or
npm install
# or
yarn install
```

This installs the `gl-matrix` library required for WebGL matrix calculations.

### Step 2: Verify Images
The component uses images from `/public/infinte menu/`:
- `01_e869a853-ae2b-4543-8f22-61455b80f6a6.webp` - Necklaces
- `Bracelets_1.webp` - Bracelets
- `NK390-1.webp` - Rings
- `PD0234_5.webp` - Earrings

**Note**: If you want to customize which images display, edit the `items` array in the InfiniteMenu section of `page.tsx`.

### Step 3: Run Development Server
```bash
pnpm dev
# or
npm run dev
```

Navigate to http://localhost:3000 and scroll down past "New Arrivals" to see the Interactive Showcase section.

## Component Props

```tsx
<InfiniteMenu 
  items={[
    {
      image: '/path/to/image.webp',
      link: '/products',
      title: 'Collection Name',
      description: 'Short description'
    }
  ]}
  scale={2.6}  // Camera distance (1.0 = default)
/>
```

### Props:
- **items** (optional): Array of collection objects with `image`, `link`, `title`, and `description`
- **scale** (optional): Number from 1-3 to adjust zoom level. Default: 1.0

## Features

### Interactive Controls
- **Drag/Rotate**: Click and drag to rotate the 3D sphere
- **Auto-snap**: Release to snap to nearest collection
- **Smooth Animations**: Collection info animates in/out as you hover
- **Mobile Responsive**: Touch-enabled on mobile devices

### UI Elements
- **Title**: Shows active collection name
- **Description**: Brief description of the collection
- **Action Button**: Center button with arrow (✗) to navigate to collection
  - Follows ORA branding with pink background and black border
  - Smooth hover and scale animations

### Responsive Design
- Desktop (1500px+): Full interactive view with overlay text
- Tablet (768px-1500px): Interactive view without text overlay
- Mobile (<768px): Optimized canvas height and button sizing

## Customization

### Change Images
Edit the `items` array in the InfiniteMenu section of [src/app/page.tsx](src/app/page.tsx):

```tsx
items={[
  {
    image: '/your-image-path.webp',
    link: '/products',
    title: 'Your Title',
    description: 'Your description'
  }
]}
```

### Adjust Zoom Level
Modify the `scale` prop (1.0 = default, 2.6 = zoomed in):

```tsx
<InfiniteMenu scale={2.0} />
```

### Modify Colors
Edit [src/components/home/InfiniteMenu.css](src/components/home/InfiniteMenu.css):

```css
.infinite-menu-button {
  background: linear-gradient(135deg, #FFD6E8 0%, #FFC0DB 100%);
  border: 3px solid #2D2D2D;
}
```

### Change Button Link Behavior
Edit the `handleButtonClick` function in InfiniteMenu.tsx to integrate with your router (Next.js Link, etc.)

## Styling & CSS Classes

### Main Classes
- `.infinite-grid-menu-canvas` - The WebGL canvas element
- `.infinite-menu-title` - Collection name (active/inactive states)
- `.infinite-menu-description` - Collection description (active/inactive states)
- `.infinite-menu-button` - Action button (active/inactive states)
- `.infinite-menu-button-icon` - Button icon (arrow)

### Modifier Classes
- `.active` - When collection is focused
- `.inactive` - When collection is not focused

All styling respects ORA's design system and includes:
- Smooth transitions and animations
- Accessibility features (prefers-reduced-motion)
- Mobile-first responsive design
- Light theme support

## Performance Considerations

### WebGL Optimization
- Uses hardware acceleration (WebGL 2)
- Efficient vertex geometry (icosahedron)
- Instanced rendering for multiple items
- Texture atlasing for image optimization

### Browser Support
- Modern browsers with WebGL 2 support (Chrome, Firefox, Safari, Edge)
- Fallback handling for image loading
- Cross-origin image support enabled

## Troubleshooting

### Issue: WebGL Error
**Solution**: Ensure browser supports WebGL 2. Check console for specific error.

### Issue: Images Not Loading
**Solution**: Verify image paths are correct and images exist in `/public/infinte menu/` folder.

### Issue: Performance Issues
**Solution**: 
- Reduce number of items
- Use optimized image formats (WebP)
- Lower canvas resolution on mobile

### Issue: Button Click Not Working
**Solution**: Update `handleButtonClick()` function with proper navigation logic for your app.

## Browser Compatibility

| Browser | Version | Support |
|---------|---------|---------|
| Chrome | 66+ | Full |
| Firefox | 79+ | Full |
| Safari | 15+ | Full |
| Edge | 79+ | Full |
| Mobile Safari | 15+ | Full |
| Chrome Mobile | 66+ | Full |

## Next Steps

1. **Test**: Load the home page and interact with the infinite menu
2. **Customize**: Update images and descriptions to match your collections
3. **Optimize**: Compress and optimize images for best performance
4. **Monitor**: Check performance in browser DevTools (Performance tab)
5. **Deploy**: Push to production once testing is complete

## Support

For issues or questions:
1. Check the InfiniteMenu.tsx component comments
2. Review WebGL console errors (F12 > Console)
3. Verify image paths and CORS settings
4. Test on different browsers for compatibility

---

**Created**: January 21, 2026
**Component**: Infinite Menu v1.0
**Color System**: ORA Luxury Design System
**Status**: ✅ Ready for Production
