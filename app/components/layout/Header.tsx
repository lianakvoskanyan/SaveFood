import Link from "next/link";

type HeaderProps = {
  brandName: string;
  navigationLabel: string;
};

export function Header({ brandName, navigationLabel }: HeaderProps) {
  return (
    <header className="site-header">
      <Link className="wordmark" href="/" aria-label={`${brandName} home`}>
        <span className="wordmark-icon" aria-hidden="true">
          f
        </span>
        {brandName}
      </Link>
      <Link className="header-link" href="/#how-it-works">
        {navigationLabel} <span aria-hidden="true">↗</span>
      </Link>
    </header>
  );
}
