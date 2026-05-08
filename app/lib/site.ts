const DEFAULT_SITE_URL = "https://insure.myprime.ge";

function normalizeSiteUrl(url: string) {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

export const siteUrl = normalizeSiteUrl(
  process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXTAUTH_URL ||
    DEFAULT_SITE_URL,
);

export const travelLocalePaths = {
  ka: "/travel/ka",
  en: "/travel/en",
} as const;

export function absoluteUrl(path = "/") {
  return new URL(path, `${siteUrl}/`).toString();
}
