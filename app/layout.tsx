import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://primeinsurance.ge"),
  title: "PRIME Insurance - ბინის დაზღვევა",
  description:
    "PRIME Insurance -  ბინის დაზღვევის პოლისი. გამოთვალე ფასი მომენტალურად და შეავსე განაცხადი ონლაინ.",
  icons: {
    icon: "/FacebookShare.png",
  },
  openGraph: {
    title: "PRIME Insurance - ბინის დაზღვევა",
    description:
      "PRIME Insurance -  ბინის დაზღვევის პოლისი. გამოთვალე ფასი მომენტალურად და შეავსე განაცხადი ონლაინ.",
    images: [
      {
        url: "/FacebookShare.png",
        width: 200,
        height: 200,
        alt: "PRIME Insurance Logo",
      },
    ],
    url: "https://primeinsurance.ge",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PRIME Insurance - ბინის დაზღვევა",
    description:
      "PRIME Insurance -  ბინის დაზღვევის პოლისი. გამოთვალე ფასი მომენტალურად და შეავსე განაცხადი ონლაინ.",
    images: ["/FacebookShare.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ka">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
