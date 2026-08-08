import styles from "./portfolio.module.css";

interface PortfolioFooterProps {
  name: string;
  domain: string;
}

export function PortfolioFooter({ name, domain }: PortfolioFooterProps) {
  const year = new Date().getFullYear();
  return (
    <footer
      className={`${styles.section} border-t border-[rgba(53,255,107,0.18)] pb-8 pt-10`}
    >
      <p className="font-mono text-xs text-white/45">
        © {year} {name} · {domain}
      </p>
    </footer>
  );
}
