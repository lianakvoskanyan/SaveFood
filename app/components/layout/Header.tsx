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
      <nav className="header-nav" aria-label="Main navigation">
        <Link className="header-link" href="/explore">
          Explore offers
        </Link>
        <Link className="header-link header-link-join" href="/signup">
          Sign up <span aria-hidden="true">↗</span>
        </Link>
        <Link className="header-link" href="/profile">
          My account
        </Link>
        <Link className="header-link header-link-business" href="/business">
          For businesses
        </Link>
        <Link className="header-link header-link-secondary" href="/#how-it-works">
          {navigationLabel}
        </Link>
      </nav>
    </header>
  );
}
