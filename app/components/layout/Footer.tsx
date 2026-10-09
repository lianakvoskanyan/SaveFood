import Link from "next/link";

type FooterProps = {
  brandName: string;
  footerMessage: string;
  footerCredit: string;
};

export function Footer({
  brandName,
  footerMessage,
  footerCredit,
}: FooterProps) {
  return (
    <footer className="site-footer">
      <Link
        className="wordmark footer-wordmark"
        href="/"
        aria-label={`${brandName} home`}
      >
        <span className="wordmark-icon" aria-hidden="true">
          f
        </span>
        {brandName}
      </Link>
      <p>{footerMessage}</p>
      <span>{footerCredit}</span>
      <Link className="footer-admin-link" href="/admin">
        Admin
      </Link>
    </footer>
  );
}
