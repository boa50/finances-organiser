# FinanceCloud

A cross-platform personal finance tracker built with **React Native** and **Expo**. It connects to a [Turso](https://turso.tech/) SQLite cloud database via **Vercel Serverless Functions** for dynamic server-side persistence, while providing an offline-first local fallback via `localStorage`. The app features password authentication, interactive D3.js charts, multi-currency support with live exchange rates, a centralized design system, unit test coverage, and full CRUD for transactions, categories, payment methods, and banks.

## ✨ Features

- **Password authentication** — Password-based access control with `sessionStorage` session persistence and server timing-safe verification.
- **Dashboard overview** — 60-day rolling net balance, monthly income/expense summary, and recent activity at a glance.
- **D3.js analytics** — Interactive donut charts, category breakdown bars, and period-filtered (5 years, 1 year, 6 months) monthly trend line/area charts rendered with `react-native-svg`.
- **Vercel Serverless API** — Node.js Serverless Functions in `/api` to securely manage Turso database connections and handle authentication, transactions, categories, payment methods, and banks.
- **Multi-currency & Currency management** — Dynamic currency management supporting BRL, USD, CAD, AUD, THB, JPY, KRW (WON), EUR, GBP, and COP (COL) with 2-step live exchange rate conversion (direct X-BRL or X-USD * USD-BRL fallback) and minimum 1 currency constraint.
- **High-performance FlashList & Screen-bounded scrolling** — List virtualization via `@shopify/flash-list` across all data screens (`TransactionsScreen`, `SubscriptionsScreen`, `ManagementScreen`, and `OverviewScreen`) with split-layout pinned headers/filters and independent list scrolling.
- **Subscription management** — Dedicated screen for managing monthly recurring subscription expenses with active/inactive toggles, payment day scheduling, and idempotent monthly transaction auto-generation.
- **Transaction & Installment management** — Full create, edit, duplicate, delete, search, and filter capabilities with monthly grouping, merchant tracking, BRL monetary conversion display on transaction cards (with converted original values shown alongside), single and multi-month installment support, and quick duplication defaulting to the current date.
- **Comprehensive management hub, Enable/Disable toggles & Drag-and-drop reordering** — Centralized tabbed screen for Categories (custom icons & colors), Payment Methods (with installment toggles), Banks, and Currencies. Each customizable entity includes an enable/disable toggle switch; disabled items are hidden when creating or editing transactions and subscriptions while remaining preserved for historical reference on older records. All customizable entities can also be freely reordered via cross-platform drag-and-drop (Web & Mobile), with the custom sort order persisted and automatically reflected throughout the application.
- **Internationalization (i18n)** — Full bilingual support for Brazilian Portuguese (`pt-BR`) and English (Australian) (`en-AU`) using `i18next` and `react-i18next`, with a header language switcher toggle and persistent user preference in `localStorage`.
- **Design system & UI primitives** — Centralized design tokens (`theme.ts`) and reusable UI primitive components.
- **Unit testing** — Jest test suite covering financial calculations, currency conversion, authentication, categories, transactions, subscriptions, currency management, and i18n key parity.
- **Cross-platform & Cloud sync** — Runs on Web, Android, and iOS via Expo with seamless offline/online fallback.

## 📋 Prerequisites

- [Node.js](https://nodejs.org/) (LTS recommended)
- [Expo CLI](https://docs.expo.dev/get-started/installation/) (installed globally or via `npx`)
- [Vercel CLI](https://vercel.com/docs/cli) (optional, for local serverless development `vercel dev`)
- A [Turso](https://turso.tech/) database for cloud persistence

## 🚀 Installation & Local Setup

1. **Clone the repository**

   ```sh
   git clone git@github.com:boa50/finances-organiser.git
   cd finances-organiser
   ```

2. **Install dependencies**

   ```sh
   npm install
   ```

3. **Configure environment variables**

   Copy `.env.example` to `.env` and fill in your credentials:

   ```sh
   cp .env.example .env
   ```

   ```dotenv
   TURSO_DATABASE_URL=libsql://your-database-name-org.turso.io
   TURSO_AUTH_TOKEN=your-turso-auth-token
   EXPO_PUBLIC_TURSO_DATABASE_URL=libsql://your-database-name-org.turso.io
   EXPO_PUBLIC_TURSO_AUTH_TOKEN=your-turso-auth-token
   APP_PASSWORD=your-app-password
   EXPO_PUBLIC_APP_PASSWORD=your-app-password
   ```

## ▶️ Getting Started

Start the Expo development server:

```sh
# Start Expo bundler
npm start

# Run on web
npm run web
```

To test Vercel Serverless Functions locally:

```sh
npx vercel dev
```

To run unit tests:

```sh
npm test
```

## 🧪 Running Tests

Run the unit test suite using Jest and ts-jest:

```sh
npm test
```

The test suite covers:
- **Financial calculations** — Income/expense aggregation, net balance, monthly grouping, and search filtering (`financials.test.ts`).
- **Currency utilities & service** — Formatting, 2-step pivot conversion, exchange rate caching, and currency CRUD rules (`currencies.test.ts`, `currencyService.test.ts`).
- **Authentication utilities & service** — Password validation, timing-safe comparison, session storage persistence, and Metro fallback (`authUtils.test.ts`, `authService.test.ts`).
- **Services & DB operations** — CRUD and auto-generation for transactions, categories, payment methods, banks, and subscriptions (`tursoService.test.ts`, `categoryService.test.ts`, `subscriptionService.test.ts`, `subscriptionAutoGenerator.test.ts`).

## 🌐 Deploying to Vercel

1. **Import the repository into Vercel**
   - Push your changes to GitHub / GitLab / Bitbucket.
   - Go to [Vercel Dashboard](https://vercel.com/new) and select your repository.

2. **Configure Environment Variables in Vercel**
   - Add `TURSO_DATABASE_URL` (e.g. `libsql://your-database.turso.io`)
   - Add `TURSO_AUTH_TOKEN` (your Turso database auth token)
   - Add `APP_PASSWORD` (your app access password)

3. **Deploy**
   - Vercel automatically detects `vercel.json` and runs `npm run build` (`npx expo export -p web`).
   - The web app is served statically while database calls route dynamically through `/api/*` Vercel Functions.

## 🏗️ Project Architecture

```
finances-organiser/
├── api/                             # Vercel Serverless Functions (Node.js)
│   ├── _db.ts                       # Server-side LibSQL client helper & table auto-migration
│   ├── auth.ts                      # POST /api/auth — timing-safe password verification
│   ├── health.ts                    # GET /api/health — database ping & status check
│   ├── transactions.ts              # CRUD /api/transactions — fetch, create, edit, delete
│   ├── categories.ts                # CRUD /api/categories — fetch, create, edit, delete
│   ├── payment-methods.ts           # CRUD /api/payment-methods — fetch, create, edit, delete
│   ├── banks.ts                     # CRUD /api/banks — fetch, create, edit, delete
│   └── currencies.ts                # CRUD /api/currencies — fetch, create, delete with guards
│
├── App.tsx                          # Root component — auth gate, tab navigation, top bar, modals
├── index.ts                         # Expo entry point (registerRootComponent)
├── app.json                         # Expo configuration
├── vercel.json                      # Vercel deployment & rewrite rules
├── jest.config.js                   # Jest + ts-jest test runner config
├── package.json
├── tsconfig.json
├── .env.example                     # Environment variable template
│
├── assets/                          # App icons, splash screen, favicon
│
└── src/
    ├── theme.ts                     # Centralized design tokens (colors, palette, typography, spacing, radii)
    │
    ├── i18n/                        # Internationalization setup and locale dictionaries
    │   ├── index.ts                 # i18next configuration, storage persistence, and toggle helpers
    │   └── locales/                 # JSON translation dictionaries
    │       ├── en-AU.json           # English (Australian) translation catalog
    │       └── pt-BR.json           # Brazilian Portuguese translation catalog
    │
    ├── types/
    │   └── index.ts                 # Shared TypeScript interfaces (Transaction, CurrencyInfo, etc.)
    │
    ├── services/
    │   ├── __tests__/               # Service test suites
    │   ├── authService.ts           # Auth service — API check, session persistence, Metro fallback
    │   ├── tursoService.ts          # Client DB service — serverless API calls + offline fallback
    │   ├── categoryService.ts       # Category service — serverless API calls + offline fallback
    │   ├── paymentMethodService.ts  # Payment method service — serverless API calls + offline fallback
    │   ├── bankService.ts           # Bank service — serverless API calls + offline fallback
    │   └── currencyService.ts       # Currency service — serverless API calls + offline fallback
    │
    ├── utils/
    │   ├── __tests__/               # Utility test suites
    │   ├── authUtils.ts             # Password validation & timing-safe string comparison
    │   ├── currencies.ts            # Currency definitions, formatting, 2-step exchange rates
    │   └── financials.ts            # Pure functions for financial math & transaction grouping
    │
    ├── screens/
    │   ├── LoginScreen.tsx          # Password authentication screen
    │   ├── OverviewScreen.tsx       # Dashboard with balance summary and recent transactions
    │   ├── AnalyticsScreen.tsx      # D3 charts (current month breakdown & historical evolution)
    │   ├── TransactionsScreen.tsx   # Searchable/filterable transaction history
    │   ├── SubscriptionsScreen.tsx  # Monthly recurring subscription manager
    │   ├── ManagementScreen.tsx     # Tabbed management hub (Categories, Payment Methods, Banks, Currencies)
    │   └── management/              # Sub-tabs and modals for entity management
    │       ├── CategoryManagementTab.tsx
    │       ├── PaymentMethodManagementTab.tsx
    │       ├── BankManagementTab.tsx
    │       ├── CurrencyManagementTab.tsx
    │       └── CurrencyAddModal.tsx
    │
    └── components/                  # Reusable UI primitives and domain components
        ├── ui/                      # Reusable UI primitive component library
        │   ├── AppText.tsx          # Standardized text component enforcing typography tokens
        │   ├── AppTextInput.tsx     # Styled text input with error state & clear button
        │   ├── AppButton.tsx        # Variant button component (primary, secondary, outline, danger)
        │   ├── AppCard.tsx          # Surface container card (default, elevated, outlined, glass)
        │   ├── AppBadge.tsx         # Pill badge for status indicators and flags
        │   ├── AppIconBadge.tsx     # Icon container badge with variant background
        │   ├── AppSectionHeader.tsx # Standardized section title, subtitle & action header
        │   ├── AppSegmentedControl.tsx # Segmented tab filter control
        │   ├── AppEmptyState.tsx    # Reusable empty data state view
        │   ├── FeedbackMessage.tsx  # Banner/toast message component
        │   └── index.ts             # UI primitive barrel export
        ├── CategoryIcon.tsx         # Lucide vector icon mapping for category display
        ├── D3CurrentMonthCharts.tsx # Donut chart + category bar chart (D3 + SVG)
        ├── D3EvolutionChart.tsx     # Monthly income/expense trend lines (D3 + SVG)
        ├── TransactionEditModal.tsx # Add/edit transaction modal form
        ├── TransactionDatePicker.tsx # Platform-resolved date picker barrel
        ├── TransactionDatePicker.native.tsx # iOS/Android date picker
        └── TransactionDatePicker.web.tsx # HTML5 date input for web
```

### Key Architectural Decisions

| Concern | Approach |
|---|---|
| **Authentication** | Password-based access control via `APP_PASSWORD` env var; serverless `/api/auth` with timing-safe comparison (`crypto.timingSafeEqual`); `sessionStorage` session persistence; Metro dev server fallback to `EXPO_PUBLIC_APP_PASSWORD`. |
| **Serverless API Layer** | Vercel Node.js Serverless Functions in `/api` handle database CRUD operations securely using server-side Turso credentials. |
| **State management** | React `useState` / `useEffect` in the root `App` component; data flows down via props. |
| **Navigation** | Manual tab router in `App.tsx` (tabs switch rendered screens). |
| **Design system** | Centralized `src/theme.ts` design tokens (palette, colors, spacing, radii, typography); 10 reusable UI primitive components in `src/components/ui/`. |
| **Icons & Emojis** | Lucide React Native vector icons mapped via `CategoryIcon.tsx`; no emojis in the UI (country flags only for currency representations). |
| **Data persistence** | Vercel Functions + Turso SQLite Cloud as primary store; `localStorage` as offline fallback. |
| **Management domain** | Separate CRUD services and API routes for Categories, Payment Methods, and Banks; transactions and subscriptions store ID foreign keys (`category_id`, `payment_method_id`, `bank_id`) to custom entities with `ON DELETE SET NULL` reference cascade; no hardcoded defaults. |
| **Charting** | D3.js for data computation (`d3.pie`, `d3.arc`, `d3.curveMonotoneX`) rendered via `react-native-svg` paths using theme typography. |
| **List Virtualization** | High-performance recycling via `@shopify/flash-list` with screen-bounded split layouts (pinned headers & search bars, independent list scrolling). |
| **Unit testing** | Jest + ts-jest test runner covering pure utility functions, auth services, entity CRUD, localized currencies, and i18n key parity & codebase scan (100 passing unit tests across 13 suites). |
| **Internationalization (i18n)** | `i18next` + `react-i18next` with `pt-BR` and `en-AU` catalogs; reactive `useTranslation` hooks; language selector on header; persistence in `localStorage` (`financecloud_language`). |
| **Platform splits** | `.native.tsx` / `.web.tsx` file extensions for platform-specific behavior (e.g. date pickers). |
| **Currency conversion** | Pivot-based conversion through BRL using cached exchange rates (60s TTL). |

## 📚 Useful Documentation

| Resource | Link |
|---|---|
| Vercel Serverless Functions | https://vercel.com/docs/functions |
| Expo Documentation | https://docs.expo.dev/ |
| React Native | https://reactnative.dev/docs/getting-started |
| Turso (libSQL) | https://docs.turso.tech/ |
| D3.js | https://d3js.org/ |
| React Native SVG | https://github.com/software-mansion/react-native-svg |
| Lucide Icons (React Native) | https://lucide.dev/guide/packages/lucide-react-native |
| AwesomeAPI (Exchange Rates) | https://docs.awesomeapi.com.br/api-de-moedas |

## 📄 License

This project is distributed under the [MIT License](LICENSE).