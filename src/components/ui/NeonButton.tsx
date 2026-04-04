import Link from "next/link";

interface NeonButtonProps {
  href: string;
  children: React.ReactNode;
  external?: boolean;
}

export default function NeonButton({ href, children, external }: NeonButtonProps) {
  const cls =
    "inline-block px-5 py-2.5 m-2.5 text-neon bg-transparent border-2 border-neon rounded-md font-vt323 cursor-pointer transition-colors duration-300 hover:bg-neon hover:text-black no-underline";

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={cls}>
      {children}
    </Link>
  );
}
