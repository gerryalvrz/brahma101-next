import Image from "next/image";

interface GlowImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
}

export default function GlowImage({
  src,
  alt,
  width = 250,
  height = 250,
  className,
}: GlowImageProps) {
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      loading="eager"
      className={
        className ??
        "glowing-image rounded-[10px] shadow-neon-thin transition-all duration-300 hover:shadow-neon-strong hover:scale-[1.02]"
      }
      unoptimized
    />
  );
}
