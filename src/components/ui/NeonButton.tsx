import Link from "next/link";

interface NeonButtonProps {
  href: string;
  children: React.ReactNode;
  external?: boolean;
  className?: string;
}

const DEFAULT_CLASS =
  "inline-block px-5 py-2.5 m-2.5 rounded-[5px] text-[#00ff00] border-2 border-[#00ff00] bg-transparent font-vt323 text-lg cursor-pointer transition-colors duration-300 hover:bg-[#00ff00] hover:text-black no-underline";

/** Static HTML under /public must use a full navigation, not App Router soft nav. */
function isStaticAsset(href: string) {
  return href.startsWith("/experiments/") || /\.html(?:$|[?#])/.test(href);
}

export default function NeonButton({
  href,
  children,
  external,
  className,
}: NeonButtonProps) {
  const cls = className ?? DEFAULT_CLASS;

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
        {children}
      </a>
    );
  }

  if (isStaticAsset(href)) {
    return (
      <a href={href} className={cls}>
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
