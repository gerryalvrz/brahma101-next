/** ISO 3166-1 alpha-2 codes used with TMDB `with_origin_country`. */
export type CinemaCountry = {
  code: string;
  label: string;
};

export const cinemaCountries: CinemaCountry[] = [
  { code: "AR", label: "Argentina" },
  { code: "AU", label: "Australia" },
  { code: "AT", label: "Austria" },
  { code: "BE", label: "Belgium" },
  { code: "BR", label: "Brazil" },
  { code: "CA", label: "Canada" },
  { code: "CL", label: "Chile" },
  { code: "CN", label: "China" },
  { code: "CO", label: "Colombia" },
  { code: "CZ", label: "Czech Republic" },
  { code: "DK", label: "Denmark" },
  { code: "EG", label: "Egypt" },
  { code: "FI", label: "Finland" },
  { code: "FR", label: "France" },
  { code: "DE", label: "Germany" },
  { code: "GR", label: "Greece" },
  { code: "HK", label: "Hong Kong" },
  { code: "HU", label: "Hungary" },
  { code: "IN", label: "India" },
  { code: "ID", label: "Indonesia" },
  { code: "IR", label: "Iran" },
  { code: "IE", label: "Ireland" },
  { code: "IL", label: "Israel" },
  { code: "IT", label: "Italy" },
  { code: "JP", label: "Japan" },
  { code: "KR", label: "South Korea" },
  { code: "MX", label: "Mexico" },
  { code: "NL", label: "Netherlands" },
  { code: "NZ", label: "New Zealand" },
  { code: "NO", label: "Norway" },
  { code: "PH", label: "Philippines" },
  { code: "PL", label: "Poland" },
  { code: "PT", label: "Portugal" },
  { code: "RO", label: "Romania" },
  { code: "RU", label: "Russia" },
  { code: "RS", label: "Serbia" },
  { code: "ZA", label: "South Africa" },
  { code: "ES", label: "Spain" },
  { code: "SE", label: "Sweden" },
  { code: "CH", label: "Switzerland" },
  { code: "TW", label: "Taiwan" },
  { code: "TH", label: "Thailand" },
  { code: "TR", label: "Turkey" },
  { code: "UA", label: "Ukraine" },
  { code: "GB", label: "United Kingdom" },
  { code: "US", label: "United States" },
  { code: "UY", label: "Uruguay" },
  { code: "VE", label: "Venezuela" },
];

const countryMap = new Map(
  cinemaCountries.map((c) => [c.code, c.label] as const)
);

export function countryLabel(code: string | undefined | null): string | null {
  if (!code) return null;
  return countryMap.get(code.toUpperCase()) ?? code.toUpperCase();
}
