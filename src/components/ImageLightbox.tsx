"use client";

import { useState, useEffect, useCallback } from "react";
import { X, ZoomIn } from "lucide-react";

interface ImageLightboxProps {
  src: string;
  alt: string;
  className?: string;
  fallback?: React.ReactNode;
}

export function ImageLightbox({ src, alt, className, fallback }: ImageLightboxProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Close on escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleOpen = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(true);
  }, []);

  const handleClose = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(false);
  }, []);

  if (!src) {
    return <>{fallback}</>;
  }

  return (
    <>
      {/* Thumbnail with click/touch handler */}
      <button
        type="button"
        className={`relative cursor-pointer group block rounded-full overflow-hidden ${className || ""}`}
        onClick={handleOpen}
        onTouchEnd={handleOpen}
        aria-label={`View ${alt} photo`}
      >
        <img
          src={src}
          alt={alt}
          className="h-full w-full rounded-full object-cover"
          draggable={false}
        />
        {/* Hover/active overlay with zoom icon */}
        <div className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/20 group-active:bg-black/30 transition-colors flex items-center justify-center">
          <ZoomIn className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity drop-shadow-lg" />
        </div>
      </button>

      {/* Lightbox modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={handleClose}
          onTouchEnd={handleClose}
          style={{ animation: "fadeIn 0.2s ease-out" }}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={handleClose}
            onTouchEnd={handleClose}
            className="absolute top-4 right-4 h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30 flex items-center justify-center text-white transition-colors z-10"
            aria-label="Close"
          >
            <X className="h-7 w-7" />
          </button>

          {/* Enlarged image */}
          <div
            className="relative max-w-[90vw] max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
            style={{ animation: "zoomIn 0.2s ease-out" }}
          >
            <img
              src={src}
              alt={alt}
              className="max-w-full max-h-[80vh] rounded-2xl shadow-2xl object-contain"
              draggable={false}
            />
            {/* Name label */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 rounded-b-2xl">
              <p className="text-white text-center font-medium text-lg">{alt}</p>
            </div>
          </div>

          {/* Tap anywhere to close hint */}
          <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/60 text-sm">
            Tap anywhere to close
          </p>
        </div>
      )}

      {/* CSS animations */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes zoomIn {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </>
  );
}

/**
 * Clickable avatar that opens lightbox when photo exists
 */
interface ClickableAvatarProps {
  photo?: string;
  name: string;
  size?: "sm" | "md" | "lg";
  badgeColor?: string;
}

const sizeClasses = {
  sm: "h-7 w-7 text-[10px]",
  md: "h-9 w-9 text-xs",
  lg: "h-20 w-20 text-xl",
};

function getInitials(name: string): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join("");
}

function getAutoColor(name: string): string {
  if (!name) return "bg-zinc-400";
  const colors = [
    "bg-rose-500",
    "bg-amber-500",
    "bg-emerald-500",
    "bg-cyan-500",
    "bg-violet-500",
    "bg-pink-500",
    "bg-teal-500",
    "bg-orange-500",
  ];
  const index = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[index % colors.length];
}

export function ClickableAvatar({ photo, name, size = "md", badgeColor }: ClickableAvatarProps) {
  const sizeClass = sizeClasses[size];
  const colorClass = badgeColor || getAutoColor(name);

  if (photo) {
    return (
      <ImageLightbox
        src={photo}
        alt={name}
        className={sizeClass}
      />
    );
  }

  // No photo - show initials (not clickable)
  return (
    <div
      className={`${sizeClass} rounded-full flex items-center justify-center text-white font-semibold ${colorClass}`}
    >
      {getInitials(name)}
    </div>
  );
}
