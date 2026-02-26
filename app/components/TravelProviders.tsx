"use client";

import { SessionProvider } from "next-auth/react";
import { LocaleProvider } from "@/app/context/LocaleContext";
import { ReactNode } from "react";
import { Locale } from "@/app/lib/i18n";

export default function TravelProviders({
  children,
  initialLocale = "ka",
}: {
  children: ReactNode;
  initialLocale?: Locale;
}) {
  return (
    <SessionProvider>
      <LocaleProvider initialLocale={initialLocale}>{children}</LocaleProvider>
    </SessionProvider>
  );
}
