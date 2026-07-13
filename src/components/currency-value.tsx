import { moneyToWords } from "@/lib/locale";
import type { LocaleSettings } from "@/lib/types";

export function CurrencyValue({
  minorUnits,
  settings,
}: {
  minorUnits: number;
  settings: LocaleSettings;
}) {
  const numberStr = new Intl.NumberFormat(settings.locale, {
    style: "decimal",
    maximumFractionDigits: 0,
  }).format(minorUnits / 100);
  const words = moneyToWords(minorUnits);

  return (
    <span className="currency-value">
      <span className="currency-number">{numberStr}</span>
      {words && <span className="currency-words">{words}</span>}
    </span>
  );
}
