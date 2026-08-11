---
name: financecloud-analytics
description: Use when modifying FinanceCloud D3 charts, analytics, transaction aggregation, category breakdowns, monthly trends, currency conversion, exchange rates, or financial data visualization.
---

# FinanceCloud Analytics

## Goal

Keep financial calculations correct and charts consistent across currencies, date ranges, categories, and platforms.

## Existing architecture

- D3 performs data calculations/layout.
- `react-native-svg` renders chart paths/shapes.
- `D3CurrentMonthCharts.tsx` contains current-month donut/category-bar visualizations.
- `D3EvolutionChart.tsx` contains monthly income/expense trend visualization.
- `src/utils/currencies.ts` contains currency definitions, formatting, and live exchange-rate logic.

## Currency rules

- Supported currencies: BRL, USD, EUR, GBP, CAD, AUD, JPY, CHF, INR.
- Conversion uses BRL as the pivot.
- Exchange rates are cached for 60 seconds.
- Never assume two currencies can be converted by directly multiplying an arbitrary pair unless the existing currency utility explicitly supports it.
- Keep display formatting separate from numeric conversion.
- Avoid floating-point surprises in displayed monetary values; use the project's existing formatting utilities.

## Chart rules

1. Inspect the existing aggregation logic before changing chart calculations.
2. Keep financial calculations independent from SVG rendering where practical.
3. Preserve existing chart semantics unless the task explicitly changes them.
4. Handle zero-data and single-data-point cases.
5. Handle long category names and empty categories gracefully.
6. Keep chart updates efficient; avoid unnecessary recalculation on every render.
7. Ensure chart dimensions work on Web and native platforms.
8. Do not introduce a second charting library.

## Financial correctness checklist

Before considering analytics work complete:
- Income and expense signs are correct.
- Category totals reconcile with the underlying transaction set.
- Monthly grouping uses the intended date semantics.
- Currency conversion is applied exactly once.
- Rounding is performed for presentation, not prematurely during aggregation.
- Empty datasets do not produce NaN/Infinity values.
