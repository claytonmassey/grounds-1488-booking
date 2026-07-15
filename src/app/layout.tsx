import type { Metadata } from "next";
import { Fraunces, Outfit } from "next/font/google";
import { SiteHeader } from "@/components/SiteHeader";
import { getSiteSettings } from "@/lib/content";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return {
    title: {
      default: settings.siteName,
      template: `%s · ${settings.siteName}`,
    },
    description:
      "Book The Grounds or The Glass House by the hour for photography and events.",
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getSiteSettings();

  return (
    <html lang="en" className={`${fraunces.variable} ${outfit.variable} h-full`}>
      <body className="min-h-full flex flex-col antialiased">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <footer className="site-footer">
          <span>{settings.footerText}</span>
          <a href="/policies">Policies</a>
        </footer>
      </body>
    </html>
  );
}
