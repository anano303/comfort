import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const locales = ["ka", "en"];
const defaultLocale = "ka";

function getLocale(request: NextRequest): string {
  const acceptLanguage = request.headers.get("accept-language");
  if (acceptLanguage) {
    const preferred = acceptLanguage.split(",")[0].split("-")[0];
    if (locales.includes(preferred)) {
      return preferred;
    }
  }
  return defaultLocale;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only apply locale middleware to /travel routes
  if (!pathname.startsWith("/travel")) {
    return NextResponse.next();
  }

  // Skip api routes, static files, etc.
  if (
    pathname.startsWith("/travel/api") ||
    pathname.startsWith("/_next") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Check if the pathname already has a locale under /travel
  const pathnameAfterTravel = pathname.replace("/travel", "");
  const pathnameHasLocale = locales.some(
    (locale) =>
      pathnameAfterTravel.startsWith(`/${locale}/`) ||
      pathnameAfterTravel === `/${locale}`,
  );

  if (pathnameHasLocale) {
    return NextResponse.next();
  }

  // Redirect to locale version
  const locale = getLocale(request);
  const newUrl = new URL(
    `/travel/${locale}${pathnameAfterTravel || ""}`,
    request.url,
  );
  return NextResponse.redirect(newUrl);
}

export const config = {
  matcher: ["/travel/:path*"],
};
