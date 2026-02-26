"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { Locale, translations, Translations } from "@/app/lib/home-i18n";

interface LocaleContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Translations;
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

export function HomeLocaleProvider({
  children,
  initialLocale = "ka",
}: {
  children: ReactNode;
  initialLocale?: Locale;
}) {
  const [locale, setLocale] = useState<Locale>(initialLocale);

  return (
    <LocaleContext.Provider
      value={{ locale, setLocale, t: translations[locale] }}
    >
      {children}
    </LocaleContext.Provider>
  );
}

export function useHomeLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error("useHomeLocale must be used within a HomeLocaleProvider");
  }
  return context;
}
