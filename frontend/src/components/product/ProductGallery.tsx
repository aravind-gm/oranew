'use client';

import { ChevronLeft, ChevronRight, ZoomIn, X } from 'lucide-react';
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
}

/* ─── Zoom config ─── */
const DESKTOP_ZOOM = 2.8;   // cursor-follow zoom on desktop
const MOBILE_ZOOM_SCALE = 3; // native scroll zoom on mobile

export default function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  /* Desktop zoom state */
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 });

  /* Mobile zoom state */
  const [isMobileZoomOpen, setIsMobileZoomOpen] = useState(false);
  const mobileScrollRef = useRef<HTMLDivElement>(null);

  const selectedImage = images[selectedImageIndex] || images[0];

  const handlePrevious = useCallback(() => {
    setSelectedImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  }, [images.length]);

  const handleNext = useCallback(() => {
    setSelectedImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  }, [images.length]);

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
    if (window.matchMedia('(hover: none) and (pointer: coarse)').matches) {
      setIsMobileZoomOpen(true);
    }
  }, []);

  const closeMobileZoom = useCallback(() => {
    setIsMobileZoomOpen(false);
  }, []);

  /* Lock body scroll + scroll to center when mobile zoom opens */
  useEffect(() => {
    if (isMobileZoomOpen) {
      document.body.style.overflow = 'hidden';

      // Wait for the image container to render, then scroll to center
      const timer = setTimeout(() => {
        const el = mobileScrollRef.current;
        if (el) {
          el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2;
          el.scrollTop = (el.scrollHeight - el.clientHeight) / 2;
        }
      }, 50);

      return () => {
        clearTimeout(timer);
        document.body.style.overflow = '';
      };
    }
  }, [isMobileZoomOpen, selectedImageIndex]);

  /* When switching image inside zoom overlay, re-center */
  const handleZoomImageSwitch = useCallback((index: number) => {
    setSelectedImageIndex(index);
    setTimeout(() => {
      const el = mobileScrollRef.current;
      if (el) {
        el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2;
        el.scrollTop = (el.scrollHeight - el.clientHeight) / 2;
      }
    }, 50);
  }, []);

  return (
    <>
      <div className="flex flex-col-reverse md:flex-row gap-3 md:gap-4">
        {/* ── Vertical Thumbnails (desktop left rail) / Horizontal (mobile bottom) ── */}
        {images.length > 1 && (
          <div className="flex md:flex-col gap-2.5 overflow-x-auto md:overflow-y-auto md:max-h-[600px] pb-1 md:pb-0 md:pr-1 scrollbar-hide">
            {images.map((image, index) => (
              <button
                key={image.id}
                onClick={() => setSelectedImageIndex(index)}
                className={`relative flex-shrink-0 w-[68px] h-[68px] md:w-[72px] md:h-[72px] overflow-hidden rounded-lg border-2 transition-all duration-200 ${
                  selectedImageIndex === index
                    ? 'border-primary-500 shadow-sm'
                    : 'border-transparent hover:border-neutral-300'
                }`}
              >
                <Image
                  src={image.imageUrl}
                  alt={image.altText || `${productName} ${index + 1}`}
                  fill
                  unoptimized={isSupabaseImage(image.imageUrl)}
                  className="object-cover"
                  sizes="72px"
                />
                {image.altText?.toLowerCase().includes('video') && (
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
            onMouseEnter={() => setIsZoomed(true)}
            onMouseLeave={() => { setIsZoomed(false); setZoomPosition({ x: 50, y: 50 }); }}
            onClick={handleImageTap}
          >
            {selectedImage && (
              <>
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
                  sizes="(max-width: 768px) 100vw, 50vw"
                />

                {/* Zoom hint — desktop only (hover reveal) */}
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm text-neutral-500 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-sm hidden md:flex">
                  <ZoomIn size={16} />
                </div>

                {/* Zoom hint — mobile only (always visible) */}
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-neutral-500 px-2.5 py-1.5 rounded-full shadow-sm flex md:hidden items-center gap-1.5">
                  <ZoomIn size={13} />
                  <span className="text-[10px] font-medium tracking-wide uppercase">Tap to zoom</span>
                </div>
              </>
            )}

            {/* Navigation Arrows — desktop only (hidden on mobile to avoid sticky hover) */}
            {images.length > 1 && (
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
            {images.length > 1 && (
              <div className="absolute bottom-4 left-4 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm text-neutral-600 px-3 py-1.5 rounded-full text-xs font-medium shadow-sm">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                </svg>
                {selectedImageIndex + 1} / {images.length}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          MOBILE FULL-SCREEN ZOOM — Native scroll panning
          
          Instead of transformOrigin tricks, we render the image at 3x size
          inside a scrollable container. The browser's native touch scroll
          handles all panning with momentum, inertia, and edge bounce.
          ════════════════════════════════════════════════════════════════════ */}
      {isMobileZoomOpen && selectedImage && (
        <div className="fixed inset-0 z-[9999] bg-black flex flex-col md:hidden">
          {/* ─── Top bar ─── */}
          <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 pt-3 pb-8 bg-gradient-to-b from-black/70 to-transparent">
            <span className="text-white/80 text-xs font-medium font-sans">
              {selectedImageIndex + 1} / {images.length}
            </span>
            <button
              onClick={closeMobileZoom}
              className="w-10 h-10 flex items-center justify-center bg-white/15 backdrop-blur-sm rounded-full active:bg-white/25"
              aria-label="Close zoom"
            >
              <X size={20} className="text-white" />
            </button>
          </div>

          {/* ─── Drag hint ─── */}
          <div className="absolute top-14 left-0 right-0 z-20 text-center pointer-events-none">
            <p className="text-white/40 text-[10px] tracking-[0.2em] uppercase font-medium font-sans">
              Drag to explore
            </p>
          </div>

          {/* ─── Scrollable zoom area (the magic) ─── */}
          <div
            ref={mobileScrollRef}
            className="flex-1 overflow-auto overscroll-contain"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            {/* 
              Inner container is MOBILE_ZOOM_SCALE × the viewport.
              The <img> fills this oversized box, so you get a zoomed image
              that you pan by scrolling naturally with your finger.
            */}
            <div
              style={{
                width: `${MOBILE_ZOOM_SCALE * 100}vw`,
                height: `${MOBILE_ZOOM_SCALE * 100}vh`,
                position: 'relative',
              }}
            >
              <Image
                src={selectedImage.imageUrl}
                alt={selectedImage.altText || productName}
                fill
                priority
                unoptimized={isSupabaseImage(selectedImage.imageUrl)}
                className="object-cover"
                sizes={`${MOBILE_ZOOM_SCALE * 100}vw`}
              />
            </div>
          </div>

          {/* ─── Bottom thumbnail strip ─── */}
          {images.length > 1 && (
            <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-8 pb-5 px-4">
              <div className="flex gap-2.5 justify-center">
                {images.map((image, index) => (
                  <button
                    key={image.id}
                    onClick={() => handleZoomImageSwitch(index)}
                    className={`relative w-12 h-12 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                      selectedImageIndex === index
                        ? 'border-white shadow-lg scale-110'
                        : 'border-white/30 opacity-50'
                    }`}
                  >
                    <Image
                      src={image.imageUrl}
                      alt={image.altText || `${productName} ${index + 1}`}
                      fill
                      unoptimized={isSupabaseImage(image.imageUrl)}
                      className="object-cover"
                      sizes="48px"
                    />
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
