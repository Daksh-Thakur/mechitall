'use client';

import React from 'react';

interface ImageCarouselProps {
  images: string[];
  title: string;
  currentImageIndex: number;
  setCurrentImageIndex: React.Dispatch<React.SetStateAction<number>>;
  altText?: string;
}

export default function ImageCarousel({ 
  images, 
  title, 
  currentImageIndex, 
  setCurrentImageIndex,
  altText 
}: ImageCarouselProps) {
  if (images.length === 0) return null;

  return (
    <>
      <div className="absolute inset-0 w-full h-full">
        <img 
          src={images[currentImageIndex]} 
          alt={altText || title} 
          className="w-full h-full object-cover transition-all duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent animate-fade-in" />
      </div>

      {images.length > 1 && (
        <>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
            }}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-[#06B6D4] transition-all text-xs font-bold z-20 cursor-pointer border-none outline-none"
          >
            &larr;
          </button>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-[#06B6D4] transition-all text-xs font-bold z-20 cursor-pointer border-none outline-none"
          >
            &rarr;
          </button>
        </>
      )}
    </>
  );
}
