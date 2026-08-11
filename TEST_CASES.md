# FinanceCloud — Test Cases

> **Baseline document.** This file records the current state of testing coverage for the FinanceCloud application. It should evolve as the application evolves.

## Summary

| Status | Count |
|--------|-------|
| ✅ Automated and passing | 72 |
| 🟡 Implemented but not automated | 20 |
| ⬜ Not implemented | 0 |
| 🔴 Automated but failing | 0 |
| ⚠️ Cannot currently be verified | 0 |
| **Total** | **92** |

All 72 automated tests across 11 test suites were verified passing via `npm test` on 2026-08-11.

### Automated Test Suites

- [`src/services/__tests__/apiClient.test.ts`](file:///home/boa50/Desenvolvimento/finances-organiser/src/services/__tests__/apiClient.test.ts) — API response Content-Type validation (`isJsonResponse`)
- [`src/services/__tests__/authService.test.ts`](file:///home/boa50/Desenvolvimento/finances-organiser/src/services/__tests__/authService.test.ts) — Authentication service login/logout flows and API/session state
- [`src/services/__tests__/bankService.test.ts`](file:///home/boa50/Desenvolvimento/finances-organiser/src/services/__tests__/bankService.test.ts) — Bank CRUD operations, duplicate validation, default preservation, reset
- [`src/services/__tests__/categoryService.test.ts`](file:///home/boa50/Desenvolvimento/finances-organiser/src/services/__tests__/categoryService.test.ts) — Category CRUD operations, update/add duplicate name validation
- [`src/services/__tests__/paymentMethodService.test.ts`](file:///home/boa50/Desenvolvimento/finances-organiser/src/services/__tests__/paymentMethodService.test.ts) — Payment method CRUD operations, allowInstallments flag, duplicate validation, reset
- [`src/services/__tests__/subscriptionService.test.ts`](file:///home/boa50/Desenvolvimento/finances-organiser/src/services/__tests__/subscriptionService.test.ts) — Subscription CRUD operations, active status toggling, deletion
- [`src/services/__tests__/subscriptionAutoGenerator.test.ts`](file:///home/boa50/Desenvolvimento/finances-organiser/src/services/__tests__/subscriptionAutoGenerator.test.ts) — Subscription target date calculation, monthly expense auto-generation, idempotency, billing day update scope
- [`src/services/__tests__/tursoService.test.ts`](file:///home/boa50/Desenvolvimento/finances-organiser/src/services/__tests__/tursoService.test.ts) — Transaction CRUD operations, single delete, installment group deletion, clear all
- [`src/utils/__tests__/authUtils.test.ts`](file:///home/boa50/Desenvolvimento/finances-organiser/src/utils/__tests__/authUtils.test.ts) — Password hashing, comparison, and input validation
- [`src/utils/__tests__/currencies.test.ts`](file:///home/boa50/Desenvolvimento/finances-organiser/src/utils/__tests__/currencies.test.ts) — Currency symbol lookup, formatting, conversion, and constants
- [`src/utils/__tests__/financials.test.ts`](file:///home/boa50/Desenvolvimento/finances-organiser/src/utils/__tests__/financials.test.ts) — Financial summaries, installment title parsing, monthly/category aggregation, and filtering

---

## 1. Authentication

### TC-001 — Matching passwords compare as equal

**Status:** ✅ Automated

**Priority:** High

**Feature:** Authentication

**Platform:** All

**Given** Two identical password strings.

**When** `safeComparePasswords()` is called.

**Then** It returns `true`.

**Automation:** `src/utils/__tests__/authUtils.test.ts` — `should return true for matching passwords of equal length`

---

### TC-002 — Different passwords compare as unequal

**Status:** ✅ Automated

**Priority:** High

**Feature:** Authentication

**Platform:** All

**Given** Two different password strings of equal length.

**When** `safeComparePasswords()` is called.

**Then** It returns `false`.

**Automation:** `src/utils/__tests__/authUtils.test.ts` — `should return false for different passwords of equal length`

---

### TC-003 — Passwords of different lengths compare as unequal

**Status:** ✅ Automated

**Priority:** High

**Feature:** Authentication

**Platform:** All

**Given** Two passwords of different lengths.

**When** `safeComparePasswords()` is called.

**Then** It returns `false`.

**Automation:** `src/utils/__tests__/authUtils.test.ts` — `should return false for passwords of different lengths`

---

### TC-004 — Non-string arguments are rejected by password comparison

**Status:** ✅ Automated

**Priority:** Medium

**Feature:** Authentication

**Platform:** All

**Given** `null` or `undefined` passed as a password argument.

**When** `safeComparePasswords()` is called.

**Then** It returns `false`.

**Automation:** `src/utils/__tests__/authUtils.test.ts` — `should return false if any argument is not a string`

---

### TC-005 — Non-empty string is valid password input

**Status:** ✅ Automated

**Priority:** Medium

**Feature:** Authentication

**Platform:** All

**Given** A non-empty password string.

**When** `isValidPasswordInput()` is called.

**Then** It returns `true`.

**Automation:** `src/utils/__tests__/authUtils.test.ts` — `should return true for non-empty string`

---

### TC-006 — Empty or whitespace-only password input is invalid

**Status:** ✅ Automated

**Priority:** Medium

**Feature:** Authentication

**Platform:** All

**Given** An empty string or a whitespace-only string.

**When** `isValidPasswordInput()` is called.

**Then** It returns `false`.

**Automation:** `src/utils/__tests__/authUtils.test.ts` — `should return false for empty string or whitespace only`

---

### TC-007 — Non-string types are rejected as password input

**Status:** ✅ Automated

**Priority:** Low

**Feature:** Authentication

**Platform:** All

**Given** `null` or a number passed as input.

**When** `isValidPasswordInput()` is called.

**Then** It returns `false`.

**Automation:** `src/utils/__tests__/authUtils.test.ts` — `should return false for non-string types`

---

### TC-008 — Auth service initializes unauthenticated

**Status:** ✅ Automated

**Priority:** High

**Feature:** Authentication

**Platform:** All

**Given** No prior login has occurred.

**When** `authService.isAuthenticated()` is checked.

**Then** It returns `false`.

**Automation:** `src/services/__tests__/authService.test.ts` — `should initialize unauthenticated`

---

### TC-009 — Logout clears authentication state

**Status:** ✅ Automated

**Priority:** High

**Feature:** Authentication

**Platform:** All

**Given** The user was previously logged in.

**When** `authService.logout()` is called.

**Then** `isAuthenticated()` returns `false`.

**Automation:** `src/services/__tests__/authService.test.ts` — `should logout and clear authentication state`

---

### TC-010 — Login rejects empty password

**Status:** ✅ Automated

**Priority:** High

**Feature:** Authentication

**Platform:** All

**Given** The API returns `{ ok: false, status: 400 }`.

**When** `authService.login('')` is called with an empty password.

**Then** `result.success` is `false` and the user remains unauthenticated.

**Automation:** `src/services/__tests__/authService.test.ts` — `should reject login with empty password`

---

### TC-011 — Login succeeds when API returns success

**Status:** ✅ Automated

**Priority:** High

**Feature:** Authentication

**Platform:** All

**Given** The API returns `{ ok: true, status: 200, json: { success: true } }`.

**When** `authService.login('password')` is called.

**Then** `result.success` is `true` and `isAuthenticated()` returns `true`.

**Automation:** `src/services/__tests__/authService.test.ts` — `should authenticate successfully when API returns success`

---

### TC-012 — Login fails when API returns 401

**Status:** ✅ Automated

**Priority:** High

**Feature:** Authentication

**Platform:** All

**Given** The API returns `{ ok: false, status: 401, json: { success: false, message: 'Invalid password...' } }`.

**When** `authService.login('wrongpassword')` is called.

**Then** `result.success` is `false`, `result.message` contains `"Invalid password"`, and the user remains unauthenticated.

**Automation:** `src/services/__tests__/authService.test.ts` — `should fail authentication when API returns 401`

---

### TC-013 — Login screen renders password input and submit button

**Status:** 🟡 Implemented but not automated

**Priority:** Medium

**Feature:** Authentication

**Platform:** Web, Android, iOS

**Given** The user is not authenticated.

**When** The app loads.

**Then** A password input field and a login button are displayed.

---

### TC-014 — Login screen shows error feedback on failed login

**Status:** 🟡 Implemented but not automated

**Priority:** Medium

**Feature:** Authentication

**Platform:** Web, Android, iOS

**Given** The user submits an incorrect password.

**When** Login fails.

**Then** An error message is displayed via `FeedbackMessage`.

---

### TC-015 — App gates access behind authentication

**Status:** 🟡 Implemented but not automated

**Priority:** High

**Feature:** Authentication

**Platform:** Web, Android, iOS

**Given** The user is not authenticated.

**When** The app renders.

**Then** Only `LoginScreen` is shown; the main app with tabs is not rendered.

---

### TC-016 — Session is persisted to sessionStorage

**Status:** 🟡 Implemented but not automated

**Priority:** Medium

**Feature:** Authentication

**Platform:** Web

**Given** The user logs in successfully.

**When** The login completes.

**Then** The session is stored in `sessionStorage`.

---

### TC-017 — Session is restored on app start

**Status:** 🟡 Implemented but not automated

**Priority:** Medium

**Feature:** Authentication

**Platform:** Web

**Given** A valid session exists in `sessionStorage`.

**When** The app loads.

**Then** The user is automatically authenticated without re-entering their password.

---

### Coverage gaps — Authentication

- Login screen UI rendering has no automated test.
- Session persistence to and restoration from `sessionStorage` has no automated test.
- API route `POST /api/auth` with `crypto.timingSafeEqual` has no server-side test.
- Password visibility toggle UI has no automated test.
- Dev mode env-var fallback (`EXPO_PUBLIC_APP_PASSWORD`) has no automated test.

---

## 2. Currency & Exchange Rates

### TC-018 — getCurrencyInfo returns correct info for known code

**Status:** ✅ Automated

**Priority:** Medium

**Feature:** Currency

**Platform:** All

**Given** Currency code `"BRL"`.

**When** `getCurrencyInfo()` is called.

**Then** It returns `{ code: 'BRL', symbol: 'R$', name: 'Brazilian Real' }`.

**Automation:** `src/utils/__tests__/currencies.test.ts` — `should return currency info for known code`

---

### TC-019 — getCurrencyInfo handles case insensitivity

**Status:** ✅ Automated

**Priority:** Low

**Feature:** Currency

**Platform:** All

**Given** Lowercase currency code `"usd"`.

**When** `getCurrencyInfo()` is called.

**Then** It returns `{ code: 'USD', symbol: '$' }`.

**Automation:** `src/utils/__tests__/currencies.test.ts` — `should handle case insensitivity`

---

### TC-020 — getCurrencyInfo returns fallback for unknown code

**Status:** ✅ Automated

**Priority:** Low

**Feature:** Currency

**Platform:** All

**Given** An unknown currency code `"XYZ"`.

**When** `getCurrencyInfo()` is called.

**Then** It returns `{ code: 'XYZ', symbol: '$' }` as a fallback.

**Automation:** `src/utils/__tests__/currencies.test.ts` — `should return fallback for unknown currency code`

---

### TC-021 — formatMoney formats positive BRL amounts

**Status:** ✅ Automated

**Priority:** Medium

**Feature:** Currency

**Platform:** All

**Given** Amount `1250.50` and currency `"BRL"`.

**When** `formatMoney()` is called.

**Then** The result contains `"R$"`, `"1"`, and `"250"`.

**Automation:** `src/utils/__tests__/currencies.test.ts` — `should format positive amounts with default currency (BRL)`

---

### TC-022 — formatMoney formats negative amounts with minus sign

**Status:** ✅ Automated

**Priority:** Medium

**Feature:** Currency

**Platform:** All

**Given** Amount `-450` and currency `"USD"`.

**When** `formatMoney()` is called.

**Then** The result contains `"-"` and `"$"`.

**Automation:** `src/utils/__tests__/currencies.test.ts` — `should format negative amounts with minus sign`

---

### TC-023 — formatMoney formats zero correctly

**Status:** ✅ Automated

**Priority:** Low

**Feature:** Currency

**Platform:** All

**Given** Amount `0` and currency `"EUR"`.

**When** `formatMoney()` is called.

**Then** The result contains `"€"` and `"0"`.

**Automation:** `src/utils/__tests__/currencies.test.ts` — `should format zero amount correctly`

---

### TC-024 — convertCurrency returns exact amount for same currency

**Status:** ✅ Automated

**Priority:** High

**Feature:** Currency

**Platform:** All

**Given** Amount `100` with source and target both `"BRL"`.

**When** `convertCurrency()` is called.

**Then** It returns `100` exactly.

**Automation:** `src/utils/__tests__/currencies.test.ts` — `should return exact amount when converting to same currency`

---

### TC-025 — convertCurrency falls back to original amount for unsupported currency

**Status:** ✅ Automated

**Priority:** Medium

**Feature:** Currency

**Platform:** All

**Given** An unsupported source currency code.

**When** `convertCurrency()` is called.

**Then** The original amount is returned as a safe fallback.

**Automation:** `src/utils/__tests__/currencies.test.ts` — `should fallback to original amount if exchange rate is missing`

---

### TC-026 — CURRENCIES constant contains default currency BRL

**Status:** ✅ Automated

**Priority:** Medium

**Feature:** Currency

**Platform:** All

**Given** The `CURRENCIES` array.

**When** Searched for `DEFAULT_CURRENCY`.

**Then** An entry with matching code is found.

**Automation:** `src/utils/__tests__/currencies.test.ts` — `should contain default currency BRL`

---

### TC-027 — Exchange rate caching (60-second TTL)

**Status:** 🟡 Implemented but not automated

**Priority:** Medium

**Feature:** Currency

**Platform:** All

**Given** An exchange rate has been fetched recently (within 60 seconds).

**When** The same currency pair is requested again.

**Then** The cached rate is returned without an additional API call.

---

### TC-028 — BRL pivot for cross-currency conversions

**Status:** 🟡 Implemented but not automated

**Priority:** Medium

**Feature:** Currency

**Platform:** All

**Given** A conversion between two non-BRL currencies (e.g. USD to EUR).

**When** The exchange rate is computed.

**Then** BRL is used as the intermediate pivot currency.

---

### Coverage gaps — Currency

- Exchange rate 60-second caching behavior has no automated test.
- BRL pivot logic for cross-currency conversions has no automated test.
- Exchange rate API failure handling has no automated test.
- Individual symbol/formatting tests for GBP, CAD, AUD, JPY, CHF, INR are not present.

---

## 3. Financial Calculations

### TC-029 — Financial summary calculates totals correctly

**Status:** ✅ Automated

**Priority:** High

**Feature:** Financial Calculations

**Platform:** All

**Given** 5 sample transactions (1 income of 5000, 4 expenses totaling 4000, with 3000 in the current month).

**When** `calculateFinancialSummary()` is called with a reference date of August 2026.

**Then** `totalIncome=5000`, `totalExpense=4000`, `totalNetBalance=1000`, `currentMonthIncome=5000`, `currentMonthExpense=3000`, `currentMonthNet=2000`.

**Automation:** `src/utils/__tests__/financials.test.ts` — `should calculate total income, total expense, and net balance correctly`

---

### TC-030 — Financial summary returns zeros for empty transactions

**Status:** ✅ Automated

**Priority:** Medium

**Feature:** Financial Calculations

**Platform:** All

**Given** An empty array of transactions.

**When** `calculateFinancialSummary()` is called.

**Then** All summary fields are `0`.

**Automation:** `src/utils/__tests__/financials.test.ts` — `should return zeros for an empty array of transactions`

---

### TC-031 — Recent transactions group installments together

**Status:** ✅ Automated

**Priority:** High

**Feature:** Financial Calculations

**Platform:** All

**Given** Two installment transactions sharing `installmentGroupId: 'laptop_group'`.

**When** `groupRecentTransactions()` is called.

**Then** They are merged into a single group item with `title='Laptop'`, `totalAmount=2000`, `installments=3`.

**Automation:** `src/utils/__tests__/financials.test.ts` — `should group installment transactions together into a single item`

---

### TC-032 — Recent transactions respect limit parameter

**Status:** ✅ Automated

**Priority:** Medium

**Feature:** Financial Calculations

**Platform:** All

**Given** 5 sample transactions.

**When** `groupRecentTransactions()` is called with `limit=2`.

**Then** The result length is at most 2.

**Automation:** `src/utils/__tests__/financials.test.ts` — `should respect the limit parameter`

---

### TC-033 — Monthly aggregation produces chronological results

**Status:** ✅ Automated

**Priority:** High

**Feature:** Financial Calculations

**Platform:** All

**Given** Transactions spanning July and August 2026.

**When** `aggregateTransactionsByMonth()` is called.

**Then** Two months are returned in chronological order with correct income/expense/net per month.

**Automation:** `src/utils/__tests__/financials.test.ts` — `should aggregate transactions by month chronologically`

---

### TC-034 — Category aggregation groups expenses with percentages

**Status:** ✅ Automated

**Priority:** High

**Feature:** Financial Calculations

**Platform:** All

**Given** Expense transactions across 3 categories (Housing=1500, Shopping=2000, Groceries/Food=500).

**When** `aggregateTransactionsByCategory()` is called for expense type.

**Then** 3 categories returned. Housing has amount=1500, correct color, percentage of approximately 37.5%.

**Automation:** `src/utils/__tests__/financials.test.ts` — `should group expense amounts by category and compute percentages`

---

### TC-035 — Category aggregation returns empty for no matching type

**Status:** ✅ Automated

**Priority:** Low

**Feature:** Financial Calculations

**Platform:** All

**Given** An empty array of transactions.

**When** `aggregateTransactionsByCategory()` is called for income type.

**Then** An empty array is returned.

**Automation:** `src/utils/__tests__/financials.test.ts` — `should return empty array if no transactions match the type`

---

### TC-036 — Filter transactions by type

**Status:** ✅ Automated

**Priority:** High

**Feature:** Financial Calculations

**Platform:** All

**Given** Transactions with both income and expense types.

**When** `filterTransactions()` is called with `{ type: 'income' }`.

**Then** Only the 1 income transaction (`Salary`) is returned.

**Automation:** `src/utils/__tests__/financials.test.ts` — `should filter transactions by type`

---

### TC-037 — Filter transactions by search query

**Status:** ✅ Automated

**Priority:** Medium

**Feature:** Financial Calculations

**Platform:** All

**Given** Transactions with various titles.

**When** `filterTransactions()` is called with `{ searchQuery: 'Rent' }`.

**Then** Only the 1 matching transaction is returned.

**Automation:** `src/utils/__tests__/financials.test.ts` — `should filter transactions by search query`

---

### TC-038 — Filter returns all transactions with default options

**Status:** ✅ Automated

**Priority:** Low

**Feature:** Financial Calculations

**Platform:** All

**Given** 5 sample transactions.

**When** `filterTransactions()` is called with no filter options.

**Then** All transactions are returned.

**Automation:** `src/utils/__tests__/financials.test.ts` — `should return all transactions when filter options are default`

---

### Coverage gaps — Financial Calculations

- Financial calculations with mixed currencies (requiring conversion) have no automated test.
- `parseInstallmentTitle()` utility is not covered by any test.
- Edge cases for zero-amount transactions and single-data-point months have no tests.

---

## 4. Categories

### TC-039 — Add and delete a custom category

**Status:** ✅ Automated

**Priority:** High

**Feature:** Categories

**Platform:** All

**Given** Default categories are loaded.

**When** A new expense category `"Test Custom Expense"` is added, then deleted.

**Then** The category count returns to the original, and the deleted category is no longer present.

**Automation:** `src/services/__tests__/categoryService.test.ts` — `adds a new category and allows deleting it`

---

### TC-040 — Duplicate category name is rejected

**Status:** ✅ Automated

**Priority:** High

**Feature:** Categories

**Platform:** All

**Given** Default categories are loaded (including `"Food & Dining"` expense).

**When** An attempt is made to add another expense category named `"Food & Dining"`.

**Then** The operation throws an error.

**Automation:** `src/services/__tests__/categoryService.test.ts` — `prevents adding duplicate category names for the same type`

---

### TC-041 — Category update validates unique name

**Status:** ✅ Automated

**Priority:** Medium

**Feature:** Categories

**Platform:** All

**Given** Two categories exist with different names.

**When** One category is renamed to match the other (same type).

**Then** The operation throws an error.

**Automation:** `src/services/__tests__/categoryService.test.ts` — `prevents updating category to an existing category name of same type`

---

### TC-042 — Default categories cannot be deleted from UI

**Status:** 🟡 Implemented but not automated

**Priority:** High

**Feature:** Categories

**Platform:** Web, Android, iOS

**Given** A default category with `isDefault: true`.

**When** The user views it in the management screen.

**Then** The delete button is not rendered.

---

### TC-043 — Reset categories to defaults

**Status:** 🟡 Implemented but not automated

**Priority:** Medium

**Feature:** Categories

**Platform:** All

**Given** Custom categories have been added.

**When** `resetToDefaults()` is called.

**Then** The category list is replaced with `DEFAULT_CATEGORIES`.

---

### TC-044 — Category list grouped by type (expense / income)

**Status:** 🟡 Implemented but not automated

**Priority:** Medium

**Feature:** Categories

**Platform:** Web, Android, iOS

**Given** Categories of both types exist.

**When** The category management tab is viewed.

**Then** Categories are displayed grouped by type.

---

### TC-045 — Category edit modal allows changing icon and color

**Status:** 🟡 Implemented but not automated

**Priority:** Medium

**Feature:** Categories

**Platform:** Web, Android, iOS

**Given** A category is selected for editing.

**When** The edit modal is opened.

**Then** The user can change the icon and color from preset options.

---

### Coverage gaps — Categories

- Category update with name uniqueness validation has no automated test.
- Reset to defaults has no automated test.
- Category type filtering in `getCategories()` is only indirectly tested.
- Default category seeding when database is empty has no automated test.
- localStorage cache round-trip has no automated test.

---

## 5. Transactions

### TC-046 — Add transaction persists to local memory and cache

**Status:** ✅ Automated

**Priority:** High

**Feature:** Transactions

**Platform:** All

**Given** A valid transaction payload.

**When** `addTransaction()` is called.

**Then** The transaction is added to local memory and saved to localStorage.

**Automation:** `src/services/__tests__/tursoService.test.ts` — `adds a transaction and retrieves it`

---

### TC-047 — Delete transaction removes from local memory

**Status:** ✅ Automated

**Priority:** High

**Feature:** Transactions

**Platform:** All

**Given** A transaction exists.

**When** `deleteTransaction(id)` is called.

**Then** The transaction is removed from local memory and localStorage.

**Automation:** `src/services/__tests__/tursoService.test.ts` — `deletes a single transaction`

---

### TC-048 — Update transaction modifies existing record

**Status:** ✅ Automated

**Priority:** High

**Feature:** Transactions

**Platform:** All

**Given** An existing transaction.

**When** `updateTransaction()` is called with new data.

**Then** The transaction is updated in local memory and synced.

**Automation:** `src/services/__tests__/tursoService.test.ts` — `updates an existing transaction`

---

### TC-049 — Update transaction throws if not found

**Status:** ✅ Automated

**Priority:** Medium

**Feature:** Transactions

**Platform:** All

**Given** An ID that does not match any existing transaction.

**When** `updateTransaction()` is called.

**Then** An error is thrown: `"Transaction not found"`.

**Automation:** `src/services/__tests__/tursoService.test.ts` — `throws error when updating non-existent transaction`

---

### TC-050 — Delete installment group removes all siblings

**Status:** ✅ Automated

**Priority:** High

**Feature:** Transactions

**Platform:** All

**Given** Multiple transactions share the same `installmentGroupId`.

**When** `deleteTransactionGroup()` is called with the group ID.

**Then** All transactions in the group are removed.

**Automation:** `src/services/__tests__/tursoService.test.ts` — `deletes all transactions in an installment group`

---

### TC-051 — Clear all transactions empties the collection

**Status:** ✅ Automated

**Priority:** Medium

**Feature:** Transactions

**Platform:** All

**Given** Transactions exist.

**When** `clearAllTransactions()` is called.

**Then** The transaction collection is empty.

**Automation:** `src/services/__tests__/tursoService.test.ts` — `clears all transactions`

**Then** The transaction collection is empty.

---

### TC-052 — Transaction form validates required fields

**Status:** 🟡 Implemented but not automated

**Priority:** High

**Feature:** Transactions

**Platform:** Web, Android, iOS

**Given** The transaction edit modal is open.

**When** The user submits without required fields (title, amount > 0, category, date).

**Then** Submission is prevented with validation feedback.

---

### TC-053 — Installment creation generates multiple transactions

**Status:** 🟡 Implemented but not automated

**Priority:** High

**Feature:** Transactions

**Platform:** All

**Given** A payment method allowing installments is selected and installments > 1.

**When** The transaction is created via the API.

**Then** Multiple rows are created with sequential `installmentNumber` and shared `installmentGroupId`.

---

### TC-054 — Transaction search filters by title, category, and store

**Status:** 🟡 Implemented but not automated

**Priority:** Medium

**Feature:** Transactions

**Platform:** Web, Android, iOS

**Given** Transactions with various titles, categories, and stores.

**When** The user types a search query.

**Then** Only matching transactions are displayed.

---

### TC-055 — Transaction type filter (All / Income / Expense)

**Status:** 🟡 Implemented but not automated

**Priority:** Medium

**Feature:** Transactions

**Platform:** Web, Android, iOS

**Given** Both income and expense transactions exist.

**When** The user selects a type filter.

**Then** Only transactions of the selected type are shown.

---

### TC-056 — Transaction month filter

**Status:** 🟡 Implemented but not automated

**Priority:** Medium

**Feature:** Transactions

**Platform:** Web, Android, iOS

**Given** Transactions span multiple months.

**When** The user selects a specific month.

**Then** Only that month's transactions are shown.

---

### TC-057 — Transaction delete confirmation dialog

**Status:** 🟡 Implemented but not automated

**Priority:** Medium

**Feature:** Transactions

**Platform:** Web, Android, iOS

**Given** A transaction exists.

**When** The user taps the delete action.

**Then** A confirmation dialog is shown before actual deletion.

---

### TC-058 — Installment delete offers single vs group deletion

**Status:** 🟡 Implemented but not automated

**Priority:** High

**Feature:** Transactions

**Platform:** Web, Android, iOS

**Given** An installment transaction (part of a group).

**When** The user deletes it.

**Then** The user is offered a choice to delete only this installment or all installments.

---

### Coverage gaps — Transactions

- No automated tests exist for any transaction CRUD operation in `tursoService`.
- Installment group creation and deletion has no automated test.
- Transaction form validation has no automated test.
- API route `api/transactions.ts` (GET, POST, PUT, DELETE) has no server-side test.

---

## 6. Payment Methods

### TC-059 — Add payment method with unique name

**Status:** ✅ Automated

**Priority:** Medium

**Feature:** Payment Methods

**Platform:** All

**Given** A name that does not already exist.

**When** `addPaymentMethod()` is called.

**Then** A new payment method is created and returned.

**Automation:** `src/services/__tests__/paymentMethodService.test.ts` — `adds a new payment method with allowInstallments flag`

---

### TC-060 — Duplicate payment method name is rejected

**Status:** ✅ Automated

**Priority:** Medium

**Feature:** Payment Methods

**Platform:** All

**Given** A payment method named `"Credit Card"` already exists.

**When** `addPaymentMethod("Credit Card")` is called.

**Then** The operation throws an error.

**Automation:** `src/services/__tests__/paymentMethodService.test.ts` — `prevents adding duplicate payment method names`

---

### TC-061 — Delete non-default payment method

**Status:** ✅ Automated

**Priority:** Medium

**Feature:** Payment Methods

**Platform:** All

**Given** A custom (non-default) payment method exists.

**When** `deletePaymentMethod(id)` is called.

**Then** The payment method is removed.

**Automation:** `src/services/__tests__/paymentMethodService.test.ts` — `deletes a custom payment method`

---

### TC-062 — Default payment methods cannot be deleted from UI

**Status:** 🟡 Implemented but not automated

**Priority:** Medium

**Feature:** Payment Methods

**Platform:** Web, Android, iOS

**Given** A default payment method with `isDefault: true`.

**When** The user views it in the management screen.

**Then** The delete button is not shown.

---

### TC-063 — allowInstallments flag is persisted

**Status:** ✅ Automated

**Priority:** Medium

**Feature:** Payment Methods

**Platform:** All

**Given** A payment method is created with `allowInstallments: true`.

**When** It is retrieved.

**Then** The `allowInstallments` flag is `true`.

**Automation:** `src/services/__tests__/paymentMethodService.test.ts` — `adds a new payment method with allowInstallments flag`

---

### TC-064 — Reset payment methods to defaults

**Status:** ✅ Automated

**Priority:** Low

**Feature:** Payment Methods

**Platform:** All

**Given** Custom payment methods have been added.

**When** `resetToDefaults()` is called.

**Then** The list is replaced with `DEFAULT_PAYMENT_METHODS`.

**Automation:** `src/services/__tests__/paymentMethodService.test.ts` — `resets payment methods to default list`

---

### Coverage gaps — Payment Methods

- No automated tests exist for any payment method CRUD operation.
- API route `api/payment-methods.ts` has no server-side test.

---

## 7. Banks

### TC-065 — Add bank with unique name

**Status:** ✅ Automated

**Priority:** Medium

**Feature:** Banks

**Platform:** All

**Given** A name that does not already exist.

**When** `addBank()` is called.

**Then** A new bank is created and returned.

**Automation:** `src/services/__tests__/bankService.test.ts` — `adds a new bank`

---

### TC-066 — Duplicate bank name is rejected

**Status:** ✅ Automated

**Priority:** Medium

**Feature:** Banks

**Platform:** All

**Given** A bank named `"Nubank"` already exists.

**When** `addBank("Nubank")` is called.

**Then** The operation throws an error.

**Automation:** `src/services/__tests__/bankService.test.ts` — `prevents adding duplicate bank names`

---

### TC-067 — Delete non-default bank

**Status:** ✅ Automated

**Priority:** Medium

**Feature:** Banks

**Platform:** All

**Given** A custom (non-default) bank exists.

**When** `deleteBank(id)` is called.

**Then** The bank is removed.

**Automation:** `src/services/__tests__/bankService.test.ts` — `deletes a custom bank`

---

### TC-068 — Default banks cannot be deleted from UI

**Status:** 🟡 Implemented but not automated

**Priority:** Medium

**Feature:** Banks

**Platform:** Web, Android, iOS

**Given** A default bank with `isDefault: true`.

**When** The user views it in the management screen.

**Then** The delete button is not shown.

---

### TC-069 — Reset banks to defaults

**Status:** ✅ Automated

**Priority:** Low

**Feature:** Banks

**Platform:** All

**Given** Custom banks have been added.

**When** `resetToDefaults()` is called.

**Then** The list is replaced with `DEFAULT_BANKS`.

**Automation:** `src/services/__tests__/bankService.test.ts` — `resets banks to defaults`

---

### Coverage gaps — Banks

- No automated tests exist for any bank CRUD operation.
- API route `api/banks.ts` has no server-side test.

---

## 8. Dashboard & Overview

### TC-070 — Overview shows current month summary

**Status:** 🟡 Implemented but not automated

**Priority:** High

**Feature:** Dashboard

**Platform:** Web, Android, iOS

**Given** Transactions exist for the current month.

**When** The Overview screen is displayed.

**Then** Income, expenses, and balance for the current month are shown.

---

### TC-071 — Month navigation on overview

**Status:** 🟡 Implemented but not automated

**Priority:** Medium

**Feature:** Dashboard

**Platform:** Web, Android, iOS

**Given** The Overview screen is displayed.

**When** The user taps previous/next month buttons.

**Then** The summary and charts update to reflect the selected month.

---

### TC-072 — Overview shows expense breakdown charts

**Status:** 🟡 Implemented but not automated

**Priority:** Medium

**Feature:** Dashboard

**Platform:** Web, Android, iOS

**Given** Expense transactions exist for the selected month.

**When** The Overview screen is displayed.

**Then** D3 donut and bar charts show the category expense breakdown.

---

### TC-073 — Overview shows recent transactions

**Status:** 🟡 Implemented but not automated

**Priority:** Medium

**Feature:** Dashboard

**Platform:** Web, Android, iOS

**Given** Transactions exist for the selected month.

**When** The Overview screen is displayed.

**Then** The 5 most recent transactions for that month are listed.

---

### TC-074 — Overview empty state

**Status:** 🟡 Implemented but not automated

**Priority:** Medium

**Feature:** Dashboard

**Platform:** Web, Android, iOS

**Given** No transactions exist for the selected month.

**When** The Overview screen is displayed.

**Then** An `AppEmptyState` component is shown.

---

### Coverage gaps — Dashboard

- No automated tests exist for any dashboard/overview screen behavior.
- Chart rendering and data accuracy have no automated tests.

---

## 9. Analytics

### TC-075 — Evolution chart shows income/expense trends

**Status:** 🟡 Implemented but not automated

**Priority:** Medium

**Feature:** Analytics

**Platform:** Web, Android, iOS

**Given** Transactions span multiple months.

**When** The Analytics screen is displayed.

**Then** The D3 evolution chart renders income/expense trend lines.

---

### TC-076 — Time range filter (3M, 6M, 12M, All)

**Status:** 🟡 Implemented but not automated

**Priority:** Medium

**Feature:** Analytics

**Platform:** Web, Android, iOS

**Given** The Analytics screen is displayed.

**When** The user selects a different time range.

**Then** The chart updates to show only data within that range.

---

### TC-077 — Category filter on analytics

**Status:** 🟡 Implemented but not automated

**Priority:** Low

**Feature:** Analytics

**Platform:** Web, Android, iOS

**Given** The Analytics screen is displayed.

**When** The user selects a category filter.

**Then** The chart updates to show only data for that category.

---

### Coverage gaps — Analytics

- No automated tests exist for any analytics screen behavior.
- Currency conversion in aggregations has no automated test.

---

## 10. Offline Persistence & API Fallback

### TC-078 — isJsonResponse prevents SPA rewrite false positives

**Status:** ✅ Automated

**Priority:** High

**Feature:** Offline Persistence

**Platform:** Web (Expo dev mode)

**Given** The API returns `200 OK` with `Content-Type: text/html` (SPA rewrite).

**When** Any service method calls the API.

**Then** `isJsonResponse()` returns `false`, and the service falls through to libSQL or localStorage.

**Automation:** `src/services/__tests__/apiClient.test.ts` — `returns false for ok response with text/html header (SPA rewrite in dev mode)`

---

### TC-079 — Services fall through API to libSQL to localStorage

**Status:** 🟡 Implemented but not automated

**Priority:** High

**Feature:** Offline Persistence

**Platform:** All

**Given** The Vercel API is unavailable.

**When** Data is requested (e.g. `getCategories()`, `getTransactions()`).

**Then** The service tries the direct libSQL client, then falls back to localStorage cache.

---

### TC-080 — localStorage cache is saved and restored

**Status:** 🟡 Implemented but not automated

**Priority:** Medium

**Feature:** Offline Persistence

**Platform:** Web

**Given** Data has been loaded from the API or libSQL.

**When** The data is saved to localStorage and the app reloads.

**Then** The cached data is available immediately from localStorage.

---

### TC-081 — Data persists when both API and libSQL are unavailable

**Status:** 🟡 Implemented but not automated

**Priority:** Medium

**Feature:** Offline Persistence

**Platform:** Web

**Given** Both the API and direct libSQL client are unavailable.

**When** The app loads.

**Then** Previously cached localStorage data is used as a fallback.

---

### Coverage gaps — Offline Persistence

- No automated tests verify the API to libSQL to localStorage fallback chain.
- `isJsonResponse()` integration across all services has no automated test.
- localStorage save/load round-trip has no automated test.
