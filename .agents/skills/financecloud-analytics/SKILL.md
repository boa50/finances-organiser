---
name: financecloud-analytics
description: Use when modifying FinanceCloud D3 charts, analytics, transaction aggregation, category breakdowns, monthly trends, currency conversion, exchange rates, or financial data visualization.
---

# FinanceCloud Analytics & Charts

## Goal

Ensure financial calculations are exact, currency conversions are correctly pivoted through BRL, and D3 + SVG visualizations remain modular, performant, and standardized across Web, Android, and iOS.

---

## Analytics & Chart Architecture

- **D3 Calculation & Layout**: D3 utilities (`d3.pie`, `d3.arc`, `d3.line`, `d3.area`, `d3.scaleLinear`, `d3.scaleBand`) compute geometry and data paths.
- **Rendering Layer**: `react-native-svg` renders SVG shapes, paths, text, and gradients.
- **Hook Extraction**: `src/hooks/useEvolutionChartD3.ts` encapsulates layout metrics, monthly aggregation, and SVG scaling.

### Component Structure:
- `src/components/charts/IncomeExpenseDonutChart.tsx`: Donut chart showing income vs expense split with center net balance.
- `src/components/charts/CategorySpendingBarChart.tsx`: Horizontal bar chart displaying spending distribution by category.
- `src/components/charts/EvolutionTrendChart.tsx`: Multi-month financial evolution area/line chart with period selectors (1M, 3M, 6M, 1Y, All).
- `src/components/analytics/MonthlyBreakdownCharts.tsx`: Container component assembling month donut and category breakdown charts.
- `src/components/analytics/MonthDetailSummaryCard.tsx`: Metric card showing net balance, income, expense, and transaction count.

> Refer to **`financecloud-design-system`** for UI primitives and typography tokens used within charts.

---

## Currency Rules

- **Supported currencies**: BRL, USD, EUR, GBP, CAD, AUD, JPY, CHF, INR.
- **Pivot currency**: All conversions use `BRL` as the internal pivot.
- **Cache**: Exchange rates are cached for 60 seconds (`src/utils/currencies.ts`).
- **Never convert twice**: Do not apply currency conversion to an amount that was already converted.
- **Separate math from display**: Calculate in full precision numbers; format strictly at the presentation boundary with `formatMoney()`.

---

## Chart Implementation Rules

1. **Reconciliation**: Chart sums must reconcile with underlying transaction datasets.
2. **Empty & edge cases**: Always handle zero-data, single-data-point, and negative balance scenarios without crashing or producing `NaN`/`Infinity`.
3. **Typography consistency**: All SVG `<Text>` nodes must use `theme.fontFamily.sans`, `theme.fontSize`, and `theme.fontWeight` values from `src/theme.ts`.
4. **No second chart library**: D3 + `react-native-svg` is the project standard; do not introduce Chart.js, Victory, or other libraries.
5. **Memoization**: Memoize D3 calculations with `useMemo` so that screen re-renders do not recalculate complex chart layouts unnecessarily.

---

## Financial Correctness Checklist

Before marking analytics tasks complete:
- [ ] Income (positive) vs Expense (negative/cost) semantics are properly maintained.
- [ ] Category spending bar percentages total 100% of expenses.
- [ ] Multi-currency transactions are converted to the selected active currency.
- [ ] Empty state renders `AppEmptyState` instead of a broken SVG container.
- [ ] SVG dimensions adapt gracefully across mobile screens and wide desktop views.
