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

/* ─── Zoom scale factors ─── */
const DESKTOP_ZOOM = 2.8;
const MOBILE_ZOOM = 3;

export default function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 });

  /* Mobile-specific state */
  const [isMobileZoomOpen, setIsMobileZoomOpen] = useState(false);
  const [touchStartPos, setTouchStartPos] = useState<{ x: number; y: number } | null>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const mobileZoomRef = useRef<HTMLDivElement>(null);

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

  /* ─── Mobile: tap opens full-screen zoom overlay ─── */
  const handleTap = useCallback(() => {
    // Only on touch devices (no mouse hover)
    if (window.matchMedia('(hover: none)').matches) {
      setIsMobileZoomOpen(true);
      setZoomPosition({ x: 50, y: 50 });
    }
  }, []);

  /* Track touch position in mobile zoom overlay */
  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      setTouchStartPos({ x: touch.clientX, y: touch.clientY });
      const rect = e.currentTarget.getBoundingClientRect();
      const x = ((touch.clientX - rect.left) / rect.width) * 100;
      const y = ((touch.clientY - rect.top) / rect.height) * 100;
      setZoomPosition({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 1) {
      e.preventDefault(); // prevent page scroll while panning
      const touch = e.touches[0];
      const rect = e.currentTarget.getBoundingClientRect();
      const x = ((touch.clientX - rect.left) / rect.width) * 100;
      const y = ((touch.clientY - rect.top) / rect.height) * 100;
      setZoomPosition({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
    }
  }, []);

  const closeMobileZoom = useCallback(() => {
    setIsMobileZoomOpen(false);
    setZoomPosition({ x: 50, y: 50 });
  }, []);

  /* Lock body scroll when mobile zoom is open */
  useEffect(() => {
    if (isMobileZoomOpen) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [isMobileZoomOpen]);

  /* Swipe left/right to change image in mobile zoom */
  const handleMobileZoomTouchEnd = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (!touchStartPos) return;
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartPos.x;
    const deltaY = touch.clientY - touchStartPos.y;
    // Only count as swipe if horizontal distance > vertical and > 60px
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 60) {
      if (deltaX > 0) {
        handlePrevious();
      } else {
        handleNext();
      }
      setZoomPosition({ x: 50, y: 50 });
    }
    setTouchStartPos(null);
  }, [touchStartPos, handlePrevious, handleNext]);

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
                {/* Video indicator for future */}
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
            ref={imageContainerRef}
            className="relative w-full aspect-[3/4] md:aspect-[4/5] overflow-hidden rounded-xl bg-neutral-50 group cursor-zoom-in"
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsZoomed(true)}
            onMouseLeave={() => { setIsZoomed(false); setZoomPosition({ x: 50, y: 50 }); }}
            onClick={handleTap}
          >
            {selectedImage && (
              <>
                <Image
                  src={selectedImage.imageUrl}
                  alt={selectedImage.altText || productName}
                  fill
                  priority
                  unoptimized={isSupabaseImage(selectedImage.imageUrl)}
                  className={`object-cover transition-transform duration-300 ease-out ${
                    isZoomed ? `scale-[${DESKTOP_ZOOM}]` : 'scale-100'
                  }`}
                  style={
                    isZoomed
                      ? { transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`, transform: `scale(${DESKTOP_ZOOM})` }
                      : {}
                  }
                  sizes="(max-width: 768px) 100vw, 50vw"
                />

                {/* Zoom hint — desktop hover */}
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm text-neutral-500 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-sm hidden md:flex">
                  <ZoomIn size={16} />
                </div>

                {/* Zoom hint — mobile tap */}
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm text-neutral-500 p-2 rounded-full shadow-sm flex md:hidden items-center gap-1.5">
                  <ZoomIn size={14} />
                  <span className="text-[10px] font-medium tracking-wide">TAP TO ZOOM</span>
                </div>
              </>
            )}

            {/* Navigation Arrows — refined pill style */}
            {images.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); handlePrevious(); }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center bg-white/90 backdrop-blur-sm hover:bg-white rounded-full transition-all duration-200 z-10 shadow-sm opacity-0 group-hover:opacity-100"
                  aria-label="Previous image"
                >
                  <ChevronLeft size={18} className="text-neutral-700" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleNext(); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center bg-white/90 backdrop-blur-sm hover:bg-white rounded-full transition-all duration-200 z-10 shadow-sm opacity-0 group-hover:opacity-100"
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
          MOBILE FULL-SCREEN ZOOM OVERLAY
          ════════════════════════════════════════════════════════════════════ */}
      {isMobileZoomOpen && selectedImage && (
        <div className="fixed inset-0 z-[9999] bg-black flex flex-col md:hidden">
          {/* Top bar */}
          <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/60 to-transparent">
            <span className="text-white/80 text-xs font-medium">
              {selectedImageIndex + 1} / {images.length}
            </span>
            <button
              onClick={closeMobileZoom}
              className="w-9 h-9 flex items-center justify-center bg-white/15 backdrop-blur-sm rounded-full"
              aria-label="Close zoom"
            >
              <X size={18} className="text-white" />
            </button>
          </div>

          {/* Hint text */}
          <div className="absolute top-14 left-0 right-0 z-10 text-center pointer-events-none">
            <p className="text-white/50 text-[10px] tracking-[0.15em] uppercase font-medium">
              Drag to explore · Swipe to change image
            </p>
          </div>

          {/* Zoomed image — touch to pan */}
          <div
            ref={mobileZoomRef}
            className="flex-1 relative overflow-hidden"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleMobileZoomTouchEnd}
          >
            <Image
              src={selectedImage.imageUrl}
              alt={selectedImage.altText || productName}
              fill
              priority
              unoptimized={isSupabaseImage(selectedImage.imageUrl)}
              className="object-cover"
              style={{
                transform: `scale(${MOBILE_ZOOM})`,
                transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
                transition: 'transform-origin 0.1s ease-out',
              }}
              sizes="100vw"
            />
          </div>

          {/* Bottom thumbnail strip */}
          {images.length > 1 && (
            <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/70 to-transparent pt-6 pb-4 px-4">
              <div className="flex gap-2 justify-center">
                {images.map((image, index) => (
                  <button
                    key={image.id}
                    onClick={() => { setSelectedImageIndex(index); setZoomPosition({ x: 50, y: 50 }); }}
                    className={`relative w-12 h-12 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                      selectedImageIndex === index
                        ? 'border-white shadow-lg'
                        : 'border-white/30 opacity-60'
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
