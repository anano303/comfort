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

  return {
    title: m.title,
    description: m.description,
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
