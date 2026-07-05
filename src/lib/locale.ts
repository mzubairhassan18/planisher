import type { LocaleSettings } from "@/lib/types";

const regionCurrency: Record<string, string> = {
  AE: "AED",
  AU: "AUD",
  CA: "CAD",
  CH: "CHF",
  CN: "CNY",
  DE: "EUR",
  ES: "EUR",
  FR: "EUR",
  GB: "GBP",
  IE: "EUR",
  IN: "INR",
  IT: "EUR",
  JP: "JPY",
  NL: "EUR",
  NZ: "NZD",
  PK: "PKR",
  QA: "QAR",
  SA: "SAR",
  SG: "SGD",
  US: "USD",
  ZA: "ZAR",
};

const timezoneRegion: Record<string, string> = {
  "America/Los_Angeles": "US",
  "America/New_York": "US",
  "Asia/Calcutta": "IN",
  "Asia/Dubai": "AE",
  "Asia/Karachi": "PK",
  "Asia/Kolkata": "IN",
  "Asia/Riyadh": "SA",
  "Asia/Singapore": "SG",
  "Australia/Sydney": "AU",
  "Europe/Berlin": "DE",
  "Europe/London": "GB",
  "Europe/Paris": "FR",
  "Pacific/Auckland": "NZ",
};

export const fallbackLocaleSettings: LocaleSettings = {
  locale: "en-US",
  region: "US",
  timezone: "UTC",
  currency: "USD",
};

let cachedBrowserSettings: LocaleSettings | undefined;

export function detectLocaleSettings(): LocaleSettings {
  if (typeof window === "undefined") return fallbackLocaleSettings;

  const locale = navigator.languages?.[0] ?? navigator.language ?? "en-US";

  try {
    const intlLocale = new Intl.Locale(locale).maximize();
    const timezone =
      Intl.DateTimeFormat().resolvedOptions().timeZone ||
      fallbackLocaleSettings.timezone;
    const region =
      timezoneRegion[timezone] ?? intlLocale.region ?? fallbackLocaleSettings.region;

    return {
      locale,
      region,
      timezone,
      currency: regionCurrency[region] ?? fallbackLocaleSettings.currency,
    };
  } catch {
    return fallbackLocaleSettings;
  }
}

export function getLocaleSettingsSnapshot() {
  cachedBrowserSettings ??= detectLocaleSettings();
  return cachedBrowserSettings;
}

export function getServerLocaleSettingsSnapshot() {
  return fallbackLocaleSettings;
}

export function subscribeToLocaleSettings() {
  return () => undefined;
}

export function formatMoney(
  minorUnits: number,
  settings: LocaleSettings = fallbackLocaleSettings,
) {
  return new Intl.NumberFormat(settings.locale, {
    style: "currency",
    currency: settings.currency,
    maximumFractionDigits: 0,
  }).format(minorUnits / 100);
}
