import type { Metadata } from "next";
import TravelProviders from "@/app/components/TravelProviders";
import TravelHeader from "@/app/components/TravelHeader";
import { notFound } from "next/navigation";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export async function generateStaticParams() {
  return [{ locale: "ka" }, { locale: "en" }];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;

  const meta = {
    ka: {
      title:
        "PRIME Insurance — უცხოელთა ჯანმრთელობისა და უბედური შემთხვევის დაზღვევა",
      description:
        "იყიდეთ ჯანმრთელობის დაზღვევა ონლაინ უცხოელებისთვის, არარეზიდენტებისთვის და სტუდენტებისთვის საქართველოში. ბინადრობის ნებართვის (TRC) დაზღვევა, სტუდენტური ვიზის დაზღვევა, მოკლე და გრძელვადიანი სამედიცინო დაფარვა. GEOMED და GEOTRIP გეგმები PRIME Insurance-ისგან.",
    },
    en: {
      title:
        "Health Insurance for Foreigners in Georgia — Buy Online | TRC, Student, Travel",
      description:
        "Buy health & personal accident insurance online for foreigners, non-residents, students and expats in Georgia. TRC residence permit insurance, student visa insurance, short & long-term medical coverage from ₾2/day. GEOMED & GEOTRIP plans by PRIME Insurance.",
    },
  };

  const m = meta[locale as keyof typeof meta] || meta.ka;
  const baseUrl = process.env.NEXTAUTH_URL || "https://prime.ge";

  return {
    title: m.title,
    description: m.description,
    openGraph: {
      title: m.title,
      description: m.description,
      url: `${baseUrl}/travel/${locale}`,
      siteName: "PRIME Insurance",
      images: [
        {
          url: `${baseUrl}/travel-og.png`,
          width: 1200,
          height: 630,
          alt: locale === "ka" ? "PRIME Insurance - უცხოელთა დაზღვევა" : "PRIME Insurance - Foreigners Health Insurance",
        },
      ],
      locale: locale === "ka" ? "ka_GE" : "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: m.title,
      description: m.description,
      images: [`${baseUrl}/travel-og.png`],
    },
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (locale !== "ka" && locale !== "en") {
    notFound();
  }

  return (
    <TravelProviders initialLocale={locale as "ka" | "en"}>
      <TravelHeader />
      <main className="mainContent">{children}</main>
    </TravelProviders>
  );
}
