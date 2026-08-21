"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

// Cycles through `images` automatically, crossfading every `intervalMs`. Renders as a
// single static image with no rotation when only one image is given, so it's safe to wire
// up before every exterior photo exists — dropping more paths into the array is all it
// takes to turn on the rotation.
export function AutoImageCarousel({
  images,
  alt,
  intervalMs = 3000,
}: {
  images: string[];
  alt: string;
  intervalMs?: number;
}) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((current) => (current + 1) % images.length);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [images.length, intervalMs]);

  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-2xl">
      {images.map((src, i) => (
        <Image
          key={src}
          src={src}
          alt={alt}
          width={1254}
          height={1254}
          priority={i === 0}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${
            i === index ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}
    </div>
  );
}
