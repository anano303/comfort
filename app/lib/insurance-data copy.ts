// Insurance product pricing data based on GEOTRIP and GEOMED tables

export interface GEOTRIPPricing {
  hotline: { coverage: 100; limit: "unlimited"; franchise: null };
  urgentEvacuation: { coverage: 100; limit: "unlimited"; franchise: null };
  ambulatory: { coverage: 100; limit: "unlimited"; franchise: 50 };
  vaccination: { coverage: 100; limit: "unlimited"; franchise: null };
  hospitalization: { coverage: 100; limit: 7000; franchise: 50 };
  stomatology: { coverage: 100; limit: "unlimited"; franchise: 50 };
  repatriation: { coverage: 100; limit: 3500; franchise: null };
  maxLimit: 30000;
  premiumPerDay: 2;
  minPremium: 10;
}

export const GEOTRIP_PRICING: GEOTRIPPricing = {
  hotline: { coverage: 100, limit: "unlimited", franchise: null },
  urgentEvacuation: { coverage: 100, limit: "unlimited", franchise: null },
  ambulatory: { coverage: 100, limit: "unlimited", franchise: 50 },
  vaccination: { coverage: 100, limit: "unlimited", franchise: null },
  hospitalization: { coverage: 100, limit: 7000, franchise: 50 },
  stomatology: { coverage: 100, limit: "unlimited", franchise: 50 },
  repatriation: { coverage: 100, limit: 3500, franchise: null },
  maxLimit: 30000,
  premiumPerDay: 2,
  minPremium: 10,
};

export interface GEOMEDCoverageRow {
  service: string;
  id1301: {
    coverage: number;
    limit: number | "unlimited";
    franchise: number | null;
  };
  id1300: {
    coverage: number;
    limit: number | "unlimited";
    franchise: number | null;
  };
  id1299_4: {
    coverage: number;
    limit: number | "unlimited";
    franchise: number | null;
  };
  id1299_6: {
    coverage: number;
    limit: number | "unlimited";
    franchise: number | null;
  };
}

export const GEOMED_COVERAGE: GEOMEDCoverageRow[] = [
  {
    service: "hotline",
    id1301: { coverage: 100, limit: "unlimited", franchise: null },
    id1300: { coverage: 100, limit: "unlimited", franchise: null },
    id1299_4: { coverage: 100, limit: "unlimited", franchise: null },
    id1299_6: { coverage: 100, limit: "unlimited", franchise: null },
  },
  {
    service: "urgentEvacuation",
    id1301: { coverage: 100, limit: "unlimited", franchise: null },
    id1300: { coverage: 100, limit: "unlimited", franchise: null },
    id1299_4: { coverage: 100, limit: "unlimited", franchise: null },
    id1299_6: { coverage: 100, limit: "unlimited", franchise: null },
  },
  {
    service: "ambulatory",
    id1301: { coverage: 100, limit: "unlimited", franchise: 50 },
    id1300: { coverage: 100, limit: "unlimited", franchise: null },
    id1299_4: { coverage: 100, limit: "unlimited", franchise: null },
    id1299_6: { coverage: 100, limit: "unlimited", franchise: null },
  },
  {
    service: "vaccination",
    id1301: { coverage: 100, limit: "unlimited", franchise: null },
    id1300: { coverage: 100, limit: "unlimited", franchise: null },
    id1299_4: { coverage: 100, limit: "unlimited", franchise: null },
    id1299_6: { coverage: 100, limit: "unlimited", franchise: null },
  },
  {
    service: "hospitalization",
    id1301: { coverage: 100, limit: 20000, franchise: 50 },
    id1300: { coverage: 100, limit: 13500, franchise: 50 },
    id1299_4: { coverage: 100, limit: 7000, franchise: 50 },
    id1299_6: { coverage: 100, limit: 7000, franchise: 50 },
  },
  {
    service: "stomatology",
    id1301: { coverage: 100, limit: "unlimited", franchise: 50 },
    id1300: { coverage: 100, limit: "unlimited", franchise: 50 },
    id1299_4: { coverage: 100, limit: "unlimited", franchise: 50 },
    id1299_6: { coverage: 100, limit: "unlimited", franchise: 50 },
  },
  {
    service: "repatriation",
    id1301: { coverage: 100, limit: 10000, franchise: null },
    id1300: { coverage: 100, limit: 6000, franchise: null },
    id1299_4: { coverage: 100, limit: 3000, franchise: null },
    id1299_6: { coverage: 100, limit: 3000, franchise: null },
  },
];

export const GEOMED_MAX_LIMITS = {
  id1301: 70000,
  id1300: 50000,
  id1299_4: 30000,
  id1299_6: 30000,
};

export const GEOMED_PREMIUMS = {
  id1301: { regular: 480, student: 336 },
  id1300: { regular: 360, student: 252 },
  id1299_4: { regular: 210, student: 140 },
  id1299_6: { regular: 270, student: 170 },
};

export type ProductType = "GEOTRIP" | "GEOMED";
export type GeomedPlan = "id1301" | "id1300" | "id1299_4" | "id1299_6";

export function calculateGEOTRIPPremium(
  days: number,
  isOver65: boolean,
): { perDay: number; total: number } {
  const perDay = GEOTRIP_PRICING.premiumPerDay * (isOver65 ? 2 : 1);
  const total = Math.max(
    perDay * days,
    GEOTRIP_PRICING.minPremium * (isOver65 ? 2 : 1),
  );
  return { perDay, total };
}

export function calculateGEOMEDPremium(
  plan: GeomedPlan,
  isStudent: boolean,
  isOver65: boolean,
): number {
  const premiumData = GEOMED_PREMIUMS[plan];
  const base = isStudent ? premiumData.student : premiumData.regular;
  return isOver65 ? base * 2 : base;
}
