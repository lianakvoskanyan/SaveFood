import type { Metadata } from "next";
import { getHomePageContent } from "./lib/home-page";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const content = await getHomePageContent();

  return {
    title: content.seoTitle,
    description: content.seoDescription,
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
