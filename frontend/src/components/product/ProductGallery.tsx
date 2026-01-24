'use client';

import { ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';
import Image from 'next/image';
import React, { useState } from 'react';

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

export default function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });

  const selectedImage = images[selectedImageIndex] || images[0];

  const handlePrevious = () => {
    setSelectedImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setSelectedImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isZoomed) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPosition({ x, y });
  };

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div
        className="relative h-96 w-full overflow-hidden rounded-lg bg-gray-100 group cursor-zoom-in"
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsZoomed(true)}
        onMouseLeave={() => setIsZoomed(false)}
      >
        {selectedImage && (
          <>
            <Image
              src={selectedImage.imageUrl}
              alt={selectedImage.altText || productName}
              fill
              className={`object-cover transition-transform duration-300 ${
                isZoomed ? 'scale-150' : 'scale-100'
              }`}
              style={
                isZoomed
                  ? {
                      transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
                    }
                  : {}
              }
              sizes="(max-width: 768px) 100vw, 500px"
            />
            {/* Zoom Indicator */}
            <div className="absolute top-3 right-3 bg-black/50 text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
              <ZoomIn size={18} />
            </div>
          </>
        )}

        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={handlePrevious}
              className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full transition-colors z-10"
              aria-label="Previous image"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full transition-colors z-10"
              aria-label="Next image"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}

        {/* Image Counter */}
        {images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
            {selectedImageIndex + 1} / {images.length}
          </div>
        )}
      </div>

      {/* Thumbnail Navigation */}
      {images.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {images.map((image, index) => (
            <button
              key={image.id}
              onClick={() => setSelectedImageIndex(index)}
              className={`relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                selectedImageIndex === index ? 'border-blue-600' : 'border-gray-200'
              }`}
            >
              <Image
                src={image.imageUrl}
                alt={image.altText || `${productName} ${index + 1}`}
                fill
                className="object-cover"
                sizes="80px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
