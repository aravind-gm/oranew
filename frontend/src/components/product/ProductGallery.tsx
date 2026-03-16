'use client';

import { ChevronLeft, ChevronRight, ZoomIn, X, Minus, Plus } from 'lucide-react';
import Image from 'next/image';
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { isSupabaseImage } from '@/lib/imageUrlHelper';

interface ProductImage {
  id: string;
  imageUrl: string;
  altText: string;
  isPrimary: boolean;
  sortOrder: number;
}

interface ProductGalleryProps {
  images: ProductImage[];
  productName: string;
  videoUrl?: string;
}

type ProductMediaItem =
  | { type: 'image'; key: string; image: ProductImage }
  | { type: 'video'; key: string; videoUrl: string };

/* ─── Zoom config ─── */
const DESKTOP_ZOOM = 2.8;
const MOBILE_ZOOM_MIN = 2;
const MOBILE_ZOOM_MAX = 5;
const MOBILE_ZOOM_DEFAULT = 2.5;
const MOBILE_ZOOM_STEP = 0.5;

/**
 * Derive the high-res zoom URL from the hero URL.
 * CDN pattern: .../products/{id}/hero.webp → .../products/{id}/zoom.webp
 * For Supabase legacy URLs, just return the original.
 */
function getZoomUrl(imageUrl: string): string {
  // CDN URLs have /hero.webp — swap to /zoom.webp (2400px variant)
  if (imageUrl.includes('/hero.webp') || imageUrl.includes('/hero')) {
    return imageUrl.replace('/hero.webp', '/zoom.webp').replace('/hero', '/zoom');
  }
  // For Supabase or other legacy URLs, return as-is
  return imageUrl;
}

export default function ProductGallery({ images, productName, videoUrl }: ProductGalleryProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  /* Desktop zoom state */
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 });

  /* Mobile zoom state */
  const [isMobileZoomOpen, setIsMobileZoomOpen] = useState(false);
  const [mobileZoomLevel, setMobileZoomLevel] = useState(MOBILE_ZOOM_DEFAULT);
  const mobileScrollRef = useRef<HTMLDivElement>(null);
  const lastTapRef = useRef<number>(0);

  const mediaItems: ProductMediaItem[] = [
    ...images.map((image) => ({ type: 'image' as const, key: image.id, image })),
    ...(videoUrl ? [{ type: 'video' as const, key: `video-${videoUrl}`, videoUrl }] : []),
  ];

  const selectedMedia = mediaItems[selectedImageIndex] || mediaItems[0];
  const selectedImage = selectedMedia?.type === 'image' ? selectedMedia.image : null;
  const zoomImageUrl = selectedImage ? getZoomUrl(selectedImage.imageUrl) : '';

  const handlePrevious = useCallback(() => {
    setSelectedImageIndex((prev) => (prev === 0 ? mediaItems.length - 1 : prev - 1));
  }, [mediaItems.length]);

  const handleNext = useCallback(() => {
    setSelectedImageIndex((prev) => (prev === mediaItems.length - 1 ? 0 : prev + 1));
  }, [mediaItems.length]);

  /* ─── Desktop: mouse-based zoom ─── */
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isZoomed) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPosition({ x, y });
  };

  /* ─── Mobile: tap opens full-screen scrollable zoom ─── */
  const handleImageTap = useCallback(() => {
    if (!selectedImage) return;
    if (window.matchMedia('(hover: none) and (pointer: coarse)').matches) {
      setMobileZoomLevel(MOBILE_ZOOM_DEFAULT);
      setIsMobileZoomOpen(true);
    }
  }, [selectedImage]);

  const closeMobileZoom = useCallback(() => {
    setIsMobileZoomOpen(false);
  }, []);

  /* Helper: scroll to center of zoomed image */
  const scrollToCenter = useCallback(() => {
    requestAnimationFrame(() => {
      const el = mobileScrollRef.current;
      if (el) {
        el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2;
        el.scrollTop = (el.scrollHeight - el.clientHeight) / 2;
      }
    });
  }, []);

  /* Lock body scroll + scroll to center when mobile zoom opens */
  useEffect(() => {
    if (isMobileZoomOpen) {
      document.body.style.overflow = 'hidden';
      const timer = setTimeout(scrollToCenter, 80);
      return () => {
        clearTimeout(timer);
        document.body.style.overflow = '';
      };
    }
  }, [isMobileZoomOpen, scrollToCenter]);

  /* Re-center when zoom level or image changes */
  useEffect(() => {
    if (isMobileZoomOpen) {
      scrollToCenter();
    }
  }, [mobileZoomLevel, selectedImageIndex, isMobileZoomOpen, scrollToCenter]);

  /* Zoom controls */
  const handleZoomIn = useCallback(() => {
    setMobileZoomLevel((prev) => Math.min(MOBILE_ZOOM_MAX, prev + MOBILE_ZOOM_STEP));
  }, []);

  const handleZoomOut = useCallback(() => {
    setMobileZoomLevel((prev) => Math.max(MOBILE_ZOOM_MIN, prev - MOBILE_ZOOM_STEP));
  }, []);

  /* Double-tap to toggle zoom on mobile */
  const handleDoubleTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      // Double tap detected — toggle between min and max
      setMobileZoomLevel((prev) =>
        prev <= MOBILE_ZOOM_DEFAULT ? MOBILE_ZOOM_MAX : MOBILE_ZOOM_DEFAULT
      );
    }
    lastTapRef.current = now;
  }, []);

  /* Switch image inside zoom overlay */
  const handleZoomImageSwitch = useCallback((index: number) => {
    setSelectedImageIndex(index);
  }, []);

  return (
    <>
      <div className="flex flex-col-reverse md:flex-row gap-3 md:gap-4">
        {/* ── Vertical Thumbnails (desktop left rail) / Horizontal (mobile bottom) ── */}
        {mediaItems.length > 1 && (
          <div className="flex md:flex-col gap-2.5 overflow-x-auto md:overflow-y-auto md:max-h-[600px] pb-1 md:pb-0 md:pr-1 scrollbar-hide">
            {mediaItems.map((media, index) => (
              <button
                key={media.key}
                onClick={() => setSelectedImageIndex(index)}
                className={`relative flex-shrink-0 w-[68px] h-[68px] md:w-[72px] md:h-[72px] overflow-hidden rounded-lg border-2 transition-all duration-200 ${
                  selectedImageIndex === index
                    ? 'border-primary-500 shadow-sm'
                    : 'border-transparent hover:border-neutral-300'
                }`}
              >
                {media.type === 'image' ? (
                  <Image
                    src={media.image.imageUrl}
                    alt={media.image.altText || `${productName} ${index + 1}`}
                    fill
                    unoptimized={isSupabaseImage(media.image.imageUrl)}
                    className="object-cover"
                    sizes="72px"
                  />
                ) : (
                  <div className="w-full h-full bg-neutral-900 flex items-center justify-center">
                    {images[0]?.imageUrl && (
                      <Image
                        src={images[0].imageUrl}
                        alt={`${productName} video thumbnail`}
                        fill
                        unoptimized={isSupabaseImage(images[0].imageUrl)}
                        className="object-cover opacity-70"
                        sizes="72px"
                      />
                    )}
                  </div>
                )}
                {media.type === 'video' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <div className="w-6 h-6 rounded-full bg-white/90 flex items-center justify-center">
                      <svg className="w-3 h-3 text-neutral-800 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}

        {/* ── Main Image ── */}
        <div className="relative flex-1">
          <div
            className="relative w-full aspect-[3/4] md:aspect-[4/5] overflow-hidden rounded-xl bg-neutral-50 group cursor-zoom-in"
            onMouseMove={handleMouseMove}
            onMouseEnter={() => selectedImage && setIsZoomed(true)}
            onMouseLeave={() => { setIsZoomed(false); setZoomPosition({ x: 50, y: 50 }); }}
            onClick={handleImageTap}
          >
            {selectedMedia?.type === 'video' ? (
              <video
                src={selectedMedia.videoUrl}
                className="w-full h-full object-cover"
                controls
                playsInline
                preload="metadata"
              />
            ) : selectedImage ? (
              <>
                {/* Normal view: hero image (1200px) */}
                <Image
                  src={selectedImage.imageUrl}
                  alt={selectedImage.altText || productName}
                  fill
                  priority
                  unoptimized={isSupabaseImage(selectedImage.imageUrl)}
                  className="object-cover transition-transform duration-300 ease-out"
                  style={
                    isZoomed
                      ? { transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`, transform: `scale(${DESKTOP_ZOOM})` }
                      : {}
                  }
                  sizes={isZoomed ? '200vw' : '(max-width: 768px) 100vw, 50vw'}
                />

                {/* Desktop: load zoom variant (2400px) on hover for crisp quality */}
                {isZoomed && (
                  <Image
                    src={zoomImageUrl}
                    alt={selectedImage.altText || productName}
                    fill
                    unoptimized
                    className="object-cover"
                    style={{
                      transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
                      transform: `scale(${DESKTOP_ZOOM})`,
                    }}
                    sizes="200vw"
                  />
                )}

                {/* Zoom % indicator — desktop */}
                {isZoomed && (
                  <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-xs font-medium font-sans z-10 hidden md:block" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {Math.round(DESKTOP_ZOOM * 100)}%
                  </div>
                )}

                {/* Zoom hint — desktop only (hover reveal) */}
                {!isZoomed && (
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm text-neutral-500 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-sm hidden md:flex">
                    <ZoomIn size={16} />
                  </div>
                )}

                {/* Zoom hint — mobile only (always visible) */}
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-neutral-500 px-2.5 py-1.5 rounded-full shadow-sm flex md:hidden items-center gap-1.5">
                  <ZoomIn size={13} />
                  <span className="text-[10px] font-medium tracking-wide uppercase">Tap to zoom</span>
                </div>
              </>
            ) : null}

            {/* Navigation Arrows — desktop only */}
            {mediaItems.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); handlePrevious(); }}
                  className="hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 items-center justify-center bg-white/90 backdrop-blur-sm hover:bg-white rounded-full transition-all duration-200 z-10 shadow-sm opacity-0 group-hover:opacity-100"
                  aria-label="Previous image"
                >
                  <ChevronLeft size={18} className="text-neutral-700" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleNext(); }}
                  className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 items-center justify-center bg-white/90 backdrop-blur-sm hover:bg-white rounded-full transition-all duration-200 z-10 shadow-sm opacity-0 group-hover:opacity-100"
                  aria-label="Next image"
                >
                  <ChevronRight size={18} className="text-neutral-700" />
                </button>
              </>
            )}

            {/* Image counter — bottom-left pill */}
            {mediaItems.length > 1 && (
              <div className="absolute bottom-4 left-4 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm text-neutral-600 px-3 py-1.5 rounded-full text-xs font-medium shadow-sm">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                </svg>
                {selectedImageIndex + 1} / {mediaItems.length}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          MOBILE FULL-SCREEN ZOOM — Native scroll panning + zoom controls
          
          Renders the zoom variant (2400px) at Nx viewport size in a 
          scrollable container. User drags to pan, uses +/- or double-tap
          to change zoom level. Zoom % indicator always visible.
          ════════════════════════════════════════════════════════════════════ */}
      {isMobileZoomOpen && selectedImage && (
        <div className="fixed inset-0 z-[9999] bg-black flex flex-col md:hidden">
          {/* ─── Top bar ─── */}
          <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 pt-3 pb-8 bg-gradient-to-b from-black/70 to-transparent">
            <div className="flex items-center gap-2">
              <span className="text-white/80 text-xs font-medium font-sans">
                {selectedImageIndex + 1} / {mediaItems.length}
              </span>
            </div>
            <button
              onClick={closeMobileZoom}
              className="w-10 h-10 flex items-center justify-center bg-white/15 backdrop-blur-sm rounded-full active:bg-white/25"
              aria-label="Close zoom"
            >
              <X size={20} className="text-white" />
            </button>
          </div>

          {/* ─── Scrollable zoom area ─── */}
          <div
            ref={mobileScrollRef}
            className="flex-1 overflow-auto overscroll-contain"
            style={{ WebkitOverflowScrolling: 'touch' }}
            onClick={handleDoubleTap}
          >
            <div
              style={{
                width: `${mobileZoomLevel * 100}vw`,
                height: `${mobileZoomLevel * 100}vh`,
                position: 'relative',
              }}
            >
              {/* Use zoom variant (2400px) for crisp quality */}
              <Image
                src={zoomImageUrl}
                alt={selectedImage.altText || productName}
                fill
                priority
                unoptimized
                className="object-cover"
                sizes={`${Math.round(mobileZoomLevel * 100)}vw`}
              />
            </div>
          </div>

          {/* ─── Zoom controls — right side ─── */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex flex-col items-center gap-1">
            <button
              onClick={handleZoomIn}
              disabled={mobileZoomLevel >= MOBILE_ZOOM_MAX}
              className="w-10 h-10 flex items-center justify-center bg-white/20 backdrop-blur-sm rounded-full active:bg-white/30 disabled:opacity-30 transition-opacity"
              aria-label="Zoom in"
            >
              <Plus size={18} className="text-white" />
            </button>

            {/* Zoom percentage pill */}
            <div
              className="bg-white/20 backdrop-blur-sm text-white px-2.5 py-1.5 rounded-full text-[11px] font-semibold font-sans min-w-[52px] text-center"
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {Math.round(mobileZoomLevel * 100)}%
            </div>

            <button
              onClick={handleZoomOut}
              disabled={mobileZoomLevel <= MOBILE_ZOOM_MIN}
              className="w-10 h-10 flex items-center justify-center bg-white/20 backdrop-blur-sm rounded-full active:bg-white/30 disabled:opacity-30 transition-opacity"
              aria-label="Zoom out"
            >
              <Minus size={18} className="text-white" />
            </button>
          </div>

          {/* ─── Bottom thumbnail strip ─── */}
          {mediaItems.length > 1 && (
            <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-8 pb-5 px-4">
              <div className="flex gap-2.5 justify-center">
                {mediaItems.map((media, index) => (
                  <button
                    key={media.key}
                    onClick={() => handleZoomImageSwitch(index)}
                    className={`relative w-12 h-12 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                      selectedImageIndex === index
                        ? 'border-white shadow-lg scale-110'
                        : 'border-white/30 opacity-50'
                    }`}
                  >
                    {media.type === 'image' ? (
                      <Image
                        src={media.image.imageUrl}
                        alt={media.image.altText || `${productName} ${index + 1}`}
                        fill
                        unoptimized={isSupabaseImage(media.image.imageUrl)}
                        className="object-cover"
                        sizes="48px"
                      />
                    ) : (
                      <div className="w-full h-full bg-neutral-900 flex items-center justify-center">
                        {images[0]?.imageUrl && (
                          <Image
                            src={images[0].imageUrl}
                            alt={`${productName} video thumbnail`}
                            fill
                            unoptimized={isSupabaseImage(images[0].imageUrl)}
                            className="object-cover opacity-70"
                            sizes="48px"
                          />
                        )}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                          <div className="w-5 h-5 rounded-full bg-white/90 flex items-center justify-center">
                            <svg className="w-2.5 h-2.5 text-neutral-800 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
