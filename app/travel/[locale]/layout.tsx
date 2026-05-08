import type { Metadata } from "next";
import TravelProviders from "@/app/components/TravelProviders";
import TravelHeader from "@/app/components/TravelHeader";
import { notFound } from "next/navigation";
import { absoluteUrl, travelLocalePaths } from "@/app/lib/site";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

const travelMetadata = {
  ka: {
    title: "PRIME Insurance - უცხოელთა ჯანმრთელობის დაზღვევა საქართველოში",
    description:
      "ონლაინ დაზღვევა უცხოელებისთვის საქართველოში: TRC ბინადრობის ნებართვის, სტუდენტური ვიზისა და მოგზაურობისთვის. GEOMED და GEOTRIP გეგმები PRIME Insurance-ისგან.",
  },
  en: {
    title:
      "Health Insurance for Foreigners in Georgia | TRC, Student and Travel Cover",
    description:
      "Buy health and personal accident insurance online for foreigners, students, expats and non-residents in Georgia. TRC residence permit insurance, student visa insurance and travel cover from 2 GEL per day.",
  },
} as const;

export async function generateStaticParams() {
  return [{ locale: "ka" }, { locale: "en" }];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const normalizedLocale = locale === "en" ? "en" : "ka";
  const metadata = travelMetadata[normalizedLocale];
  const canonicalPath = travelLocalePaths[normalizedLocale];

  return {
    title: metadata.title,
    description: metadata.description,
    keywords: [
      "health insurance for foreigners in Georgia",
      "Georgia TRC insurance",
      "student visa insurance Georgia",
      "travel insurance Georgia",
      "medical insurance for expats in Georgia",
      "PRIME Insurance Georgia",
    ],
    alternates: {
      canonical: canonicalPath,
      languages: {
        "ka-GE": travelLocalePaths.ka,
        "en-US": travelLocalePaths.en,
        "x-default": travelLocalePaths.en,
      },
    },
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      title: metadata.title,
      description: metadata.description,
      url: absoluteUrl(canonicalPath),
      siteName: "PRIME Insurance",
      images: [
        {
          url: absoluteUrl("/travel-og.png"),
          width: 1200,
          height: 630,
          alt:
            normalizedLocale === "ka"
              ? "PRIME Insurance - უცხოელთა დაზღვევა"
              : "PRIME Insurance - Foreigners Health Insurance",
        },
      ],
      locale: normalizedLocale === "ka" ? "ka_GE" : "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: metadata.title,
      description: metadata.description,
      images: [absoluteUrl("/travel-og.png")],
    },
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (locale !== "ka" && locale !== "en") {
    notFound();
  }

  return (
    <TravelProviders initialLocale={locale}>
      <TravelHeader />
      <main className="mainContent">{children}</main>
    </TravelProviders>
  );
}
