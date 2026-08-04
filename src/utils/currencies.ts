import { CurrencyInfo } from '../types';

export const CURRENCIES: CurrencyInfo[] = [
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', flag: '🇧🇷' },
  { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸' },
  { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺' },
  { code: 'GBP', symbol: '£', name: 'British Pound', flag: '🇬🇧' },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar', flag: '🇨🇦' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', flag: '🇦🇺' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', flag: '🇯🇵' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', flag: '🇨🇭' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', flag: '🇮🇳' },
];

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
  return (
    CURRENCIES.find((c) => c.code.toUpperCase() === code.toUpperCase()) || {
      code,
      symbol: '$',
      name: code,
      flag: '🌐',
    }
  );
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
 * Loads the latest available bid prices from AwesomeAPI. Their `last` endpoint
 * accepts multiple comma-separated currency pairs in one request.
 */
export async function refreshCurrencyRates(force = false): Promise<boolean> {
  if (!force && Date.now() - ratesFetchedAt < RATE_CACHE_DURATION_MS) {
    return true;
  }

  if (pendingRateRequest) return pendingRateRequest;

  const pairs = CURRENCIES
    .filter((currency) => currency.code !== DEFAULT_CURRENCY)
    .map((currency) => `${currency.code}-${DEFAULT_CURRENCY}`)
    .join(',');

  pendingRateRequest = (async () => {
    try {
      const response = await fetch(`${AWESOME_API_URL}/${pairs}`);
      if (!response.ok) {
        throw new Error(`AwesomeAPI returned ${response.status}`);
      }

      const quotes: Record<string, AwesomeApiQuote> = await response.json();
      const nextRates: Record<string, number> = { BRL: 1 };

      Object.values(quotes).forEach((quote) => {
        const rate = Number(quote.bid);
        if (quote.codein === DEFAULT_CURRENCY && Number.isFinite(rate) && rate > 0) {
          nextRates[quote.code] = rate;
        }
      });

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
