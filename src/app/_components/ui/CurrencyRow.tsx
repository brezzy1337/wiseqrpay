import { type Currency } from "./currencies";

interface CurrencyRowProps {
  currency: Currency;
  selected: boolean;
  onSelect: () => void;
}

export function CurrencyRow({
  currency,
  selected,
  onSelect,
}: CurrencyRowProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition ${
        selected
          ? "border-wise-forest bg-wise-neutral"
          : "border-wise-hairline bg-white hover:bg-wise-neutral"
      }`}
    >
      <span className="text-2xl" aria-hidden>
        {currency.flag}
      </span>
      <span className="flex-1">
        <span className="block font-semibold text-wise-content">
          {currency.name}
        </span>
        <span className="block text-sm text-wise-tertiary">
          {currency.code}
        </span>
      </span>
      <span
        aria-hidden
        className={`h-5 w-5 rounded-full border-2 ${
          selected ? "border-wise-forest bg-wise-forest" : "border-wise-border"
        }`}
      />
    </button>
  );
}
