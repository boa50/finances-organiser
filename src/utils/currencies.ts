import { CurrencyInfo } from '../types';

export const VALID_CURRENCIES: CurrencyInfo[] = [
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', flag: '🇧🇷' },
  { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸' },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar', flag: '🇨🇦' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', flag: '🇦🇺' },
  { code: 'THB', symbol: '฿', name: 'Thai Baht', flag: '🇹🇭' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', flag: '🇯🇵' },
  { code: 'KRW', symbol: '₩', name: 'South Korean Won', flag: '🇰🇷' },
  { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺' },
  { code: 'GBP', symbol: '£', name: 'British Pound', flag: '🇬🇧' },
  { code: 'COP', symbol: '$', name: 'Colombian Peso', flag: '🇨🇴' },
];

export const CURRENCIES = VALID_CURRENCIES;

export const DEFAULT_CURRENCY = 'BRL';

const AWESOME_API_URL = 'https://economia.awesomeapi.com.br/json/last';
const RATE_CACHE_DURATION_MS = 60_000;

interface AwesomeApiQuote {
  code: string;
  codein: string;
  bid: string;
}

// Each rate is the number of BRL for one unit of the currency. BRL is the
// common base, which also lets us convert between any two supported currencies.
let ratesToBRL: Record<string, number> = { BRL: 1 };
let ratesFetchedAt = 0;
let pendingRateRequest: Promise<boolean> | null = null;

export function getCurrencyInfo(code: string): CurrencyInfo {
  let normalizedCode = (code || '').toUpperCase();
  if (normalizedCode === 'WON') normalizedCode = 'KRW';
  if (normalizedCode === 'COL') normalizedCode = 'COP';

  return (
    VALID_CURRENCIES.find((c) => c.code.toUpperCase() === normalizedCode) || {
      code,
      symbol: '$',
      name: code,
      flag: '',
    }
  );
}

export function getCurrencyName(code: string, t?: (key: string, options?: any) => string): string {
  const info = getCurrencyInfo(code);
  if (t) {
    const key = `currencies.${info.code.toUpperCase()}`;
    const translated = t(key, { defaultValue: info.name });
    if (translated && translated !== key) {
      return translated;
    }
  }
  return info.name;
}

export function formatMoney(amount: number, currencyCode: string = DEFAULT_CURRENCY): string {
  const info = getCurrencyInfo(currencyCode);
  const formattedNumber = Math.abs(amount).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return `${amount < 0 ? '-' : ''}${info.symbol}${formattedNumber}`;
}

/**
 * Loads the latest available bid prices from AwesomeAPI.
 * Uses a two-step fetch strategy:
 * 1. Request direct X-BRL pairs for all supported non-BRL currencies.
 * 2. For any currency missing a direct BRL rate, request X-USD pairs and convert via USD -> BRL.
 */
export async function refreshCurrencyRates(force = false): Promise<boolean> {
  if (!force && Date.now() - ratesFetchedAt < RATE_CACHE_DURATION_MS) {
    return true;
  }

  if (pendingRateRequest) return pendingRateRequest;

  pendingRateRequest = (async () => {
    try {
      const nextRates: Record<string, number> = { BRL: 1 };

      // Step 1: Direct BRL pairs
      const directPairs = VALID_CURRENCIES
        .filter((currency) => currency.code !== DEFAULT_CURRENCY)
        .map((currency) => `${currency.code}-${DEFAULT_CURRENCY}`)
        .join(',');

      try {
        const response = await fetch(`${AWESOME_API_URL}/${directPairs}`);
        if (response.ok) {
          const quotes: Record<string, AwesomeApiQuote> = await response.json();
          Object.values(quotes).forEach((quote) => {
            const rate = Number(quote.bid);
            if (quote.codein === DEFAULT_CURRENCY && Number.isFinite(rate) && rate > 0) {
              nextRates[quote.code] = rate;
            }
          });
        }
      } catch (err) {
        console.warn('Direct BRL rate fetch failed, trying fallback strategy:', err);
      }

      // Step 2: USD indirect pairs for currencies missing from direct rates
      const missingCurrencies = VALID_CURRENCIES.filter(
        (c) => c.code !== 'BRL' && c.code !== 'USD' && !nextRates[c.code]
      );

      if (missingCurrencies.length > 0 && nextRates['USD']) {
        const usdPairs = missingCurrencies.map((c) => `${c.code}-USD`).join(',');
        try {
          const usdResponse = await fetch(`${AWESOME_API_URL}/${usdPairs}`);
          if (usdResponse.ok) {
            const usdQuotes: Record<string, AwesomeApiQuote> = await usdResponse.json();
            Object.values(usdQuotes).forEach((quote) => {
              const rateXtoUSD = Number(quote.bid);
              if (quote.codein === 'USD' && Number.isFinite(rateXtoUSD) && rateXtoUSD > 0) {
                // Compute rate to BRL: (X -> USD) * (USD -> BRL)
                nextRates[quote.code] = rateXtoUSD * nextRates['USD'];
              }
            });
          }
        } catch (err) {
          console.warn('USD fallback rate fetch failed:', err);
        }
      }

      if (Object.keys(nextRates).length === 1) {
        throw new Error('AwesomeAPI returned no usable currency quotes');
      }

      ratesToBRL = nextRates;
      ratesFetchedAt = Date.now();
      return true;
    } catch (error) {
      console.warn('Unable to refresh currency rates from AwesomeAPI:', error);
      return false;
    } finally {
      pendingRateRequest = null;
    }
  })();

  return pendingRateRequest;
}

export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string = DEFAULT_CURRENCY
): number {
  const fromCode = fromCurrency.toUpperCase();
  const toCode = toCurrency.toUpperCase();
  if (fromCode === toCode) return amount;

  const fromRate = ratesToBRL[fromCode];
  const toRate = ratesToBRL[toCode];
  if (!fromRate || !toRate) {
    // This only occurs before the first successful fetch or for an unsupported
    // currency. Keeping the original amount is safer than using stale hardcoded
    // exchange rates; a later refresh will re-render the correct conversion.
    return amount;
  }

  return (amount * fromRate) / toRate;
}

export const EXPENSE_CATEGORIES = [
  { name: 'Food & Dining', icon: 'utensils', color: '#EF4444' },
  { name: 'Housing & Rent', icon: 'home', color: '#F97316' },
  { name: 'Transportation', icon: 'car', color: '#F59E0B' },
  { name: 'Utilities & Bills', icon: 'zap', color: '#EAB308' },
  { name: 'Entertainment', icon: 'tv', color: '#8B5CF6' },
  { name: 'Shopping', icon: 'shopping-bag', color: '#EC4899' },
  { name: 'Health & Fitness', icon: 'activity', color: '#06B6D4' },
  { name: 'Education & Learning', icon: 'book', color: '#3B82F6' },
  { name: 'Travel & Vacation', icon: 'plane', color: '#14B8A6' },
  { name: 'Subscriptions', icon: 'repeat', color: '#6366F1' },
  { name: 'Other Expenses', icon: 'more-horizontal', color: '#64748B' },
];

export const INCOME_CATEGORIES = [
  { name: 'Salary / Wages', icon: 'briefcase', color: '#10B981' },
  { name: 'Freelance & Business', icon: 'laptop', color: '#059669' },
  { name: 'Investments & Dividends', icon: 'trending-up', color: '#3B82F6' },
  { name: 'Grants & Gifts', icon: 'gift', color: '#8B5CF6' },
  { name: 'Rental Income', icon: 'key', color: '#14B8A6' },
  { name: 'Other Income', icon: 'dollar-sign', color: '#6EE7B7' },
];
