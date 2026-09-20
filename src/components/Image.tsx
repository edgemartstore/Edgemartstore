import React, { useState } from "react";

interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string;
  alt: string;
  className?: string;
}

export const Image: React.FC<ImageProps> = ({ src, alt, className = "", ...props }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // A warm, elegant off-white grocery/wholesale themed placeholder
  const DEFAULT_FALLBACK_URL = "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&auto=format&fit=crop&q=60";

  const imageSrc = error || !src ? DEFAULT_FALLBACK_URL : src;

  return (
    <div className={`relative overflow-hidden bg-zinc-900 ${className}`}>
      {/* Dynamic Glass Skeleton Loader */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-900">
          <div className="w-full h-full animate-pulse bg-gradient-to-r from-zinc-850 via-zinc-800 to-zinc-850" />
        </div>
      )}

      <img
        src={imageSrc}
        alt={alt}
        loading="lazy"
        referrerPolicy="no-referrer"
        onLoad={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          setError(true);
        }}
        className={`w-full h-full object-cover transition-opacity duration-500 ease-in-out ${
          loading ? "opacity-0" : "opacity-100"
        } ${className}`}
        {...props}
      />
    </div>
  );
};
