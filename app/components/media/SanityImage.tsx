import Image from "next/image";
import type { SanityImageSource } from "@sanity/image-url";
import { urlFor } from "../../lib/sanity/image";

type SanityImageProps = {
  value: SanityImageSource;
  alt?: string;
  width?: number;
  height?: number;
  className?: string;
  sizes?: string;
  priority?: boolean;
};

function imageAlt(value: SanityImageSource, fallback: string) {
  if (value && typeof value === "object" && "alt" in value) {
    const alt = value.alt;
    if (typeof alt === "string") {
      return alt;
    }
  }

  return fallback;
}

export function SanityImage({
  value,
  alt = "",
  width = 800,
  height = 533,
  className,
  sizes,
  priority,
}: SanityImageProps) {
  return (
    <Image
      className={className}
      src={urlFor(value).width(width).height(height).fit("crop").url()}
      alt={imageAlt(value, alt)}
      width={width}
      height={height}
      sizes={sizes}
      priority={priority}
    />
  );
}
