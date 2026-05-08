import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { absoluteUrl, siteUrl } from "@/app/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "PRIME Insurance Georgia",
    template: "%s | PRIME Insurance Georgia",
  },
  description:
    "PRIME Insurance Georgia offers online insurance products, including health coverage for foreigners, students, tourists and non-residents in Georgia.",
  icons: {
    icon: "/FacebookShare.png",
  },
  openGraph: {
    title: "PRIME Insurance Georgia",
    description:
      "Online insurance in Georgia, including health insurance for foreigners, students, tourists and non-residents.",
    images: [
      {
        url: absoluteUrl("/og-share.png"),
        width: 960,
        height: 720,
        alt: "PRIME Insurance Georgia",
      },
    ],
    url: absoluteUrl("/"),
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PRIME Insurance Georgia",
    description:
      "Online insurance in Georgia, including health insurance for foreigners, students, tourists and non-residents.",
    images: [absoluteUrl("/og-share.png")],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ka">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
