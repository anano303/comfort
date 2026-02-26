"use client";

import Link from "next/link";
import Image from "next/image";
import { useLocale } from "@/app/context/LocaleContext";
import { useSession, signOut } from "next-auth/react";

export default function TravelHeader() {
  const { locale, t, setLocale } = useLocale();
  const { data: session } = useSession();

  const user = session?.user as { name?: string; role?: string } | undefined;

  return (
    <header className="mainHeader">
      <div className="headerInner">
        {/* Logo */}
        <Link href={`/travel/${locale}`} className="logoLink">
          <div className="logoContainer">
            <Image
              src="/primeLogo.png"
              alt="PRIME Insurance"
              width={160}
              height={40}
              style={{ objectFit: "contain", width: "auto", height: "auto" }}
              priority
            />
          </div>
        </Link>

        {/* Right side: lang + auth */}
        <div className="headerRight">
          <div className="langSwitch">
            <button
              className={locale === "ka" ? "active" : ""}
              onClick={() => setLocale("ka")}
            >
              Geo
            </button>
            <span>|</span>
            <button
              className={locale === "en" ? "active" : ""}
              onClick={() => setLocale("en")}
            >
              Eng
            </button>
          </div>

          {session ? (
            <div className="headerAuth">
              <Link href={`/travel/${locale}/dashboard`} className="navHighlight">
                {user?.name}
              </Link>
              <button onClick={() => signOut()} className="navButton">
                {t.nav.logout}
              </button>
            </div>
          ) : (
            <div className="headerAuth">
              <Link href={`/travel/${locale}/auth/login`} className="navHighlight">
                {t.nav.login}
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
