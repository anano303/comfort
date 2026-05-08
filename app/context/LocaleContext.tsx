"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { Locale, getTranslations, TranslationKeys } from "@/app/lib/i18n";

interface LocaleContextType {
  locale: Locale;
  t: TranslationKeys;
  setLocale: (locale: Locale) => void;
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

export function LocaleProvider({
  children,
  initialLocale = "ka",
}: {
  children: ReactNode;
  initialLocale?: Locale;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const t = getTranslations(locale);
  const router = useRouter();
  const pathname = usePathname();

  const setLocale = useCallback(
    (newLocale: Locale) => {
      if (newLocale === locale) {
        return;
      }

      setLocaleState(newLocale);

      const segments = pathname.split("/");
      const travelIndex = segments.indexOf("travel");

      if (travelIndex >= 0 && segments[travelIndex + 1]) {
        segments[travelIndex + 1] = newLocale;
      }

      const nextPath = segments.join("/") || `/travel/${newLocale}`;
      const nextSearch =
        typeof window !== "undefined" ? window.location.search : "";
      const nextHash =
        typeof window !== "undefined" ? window.location.hash : "";

      router.push(`${nextPath}${nextSearch}${nextHash}`);
    },
    [locale, pathname, router],
  );

  return (
    <LocaleContext.Provider value={{ locale, t, setLocale }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error("useLocale must be used within a LocaleProvider");
  }
  return context;
}
