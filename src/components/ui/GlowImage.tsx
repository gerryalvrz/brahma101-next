import Image from "next/image";

interface GlowImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
}

export default function GlowImage({
  src,
  alt,
  width = 250,
  height = 250,
}: GlowImageProps) {
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className="rounded-sm shadow-neon-thin transition-all duration-300 hover:shadow-neon-strong hover:scale-[1.02]"
      unoptimized
    />
  );
}
