# FinanceCloud

A cross-platform personal finance tracker built with **React Native** and **Expo**. It connects to a [Turso](https://turso.tech/) SQLite cloud database via **Vercel Serverless Functions** for dynamic server-side persistence, while providing an offline-first local fallback via `localStorage`. The app features interactive D3.js charts, multi-currency support with live exchange rates, and full CRUD for transactions and categories.

## ✨ Features

- **Dashboard overview** — Net balance, monthly income/expense summary, and recent activity at a glance.
- **D3.js analytics** — Interactive donut charts, category breakdown bars, and monthly trend line/area charts rendered with `react-native-svg`.
- **Vercel Serverless API** — Node.js Serverless Functions in `/api` to securely manage Turso database connections and keep data dynamically updated.
- **Multi-currency** — 9 supported currencies (BRL, USD, EUR, GBP, CAD, AUD, JPY, CHF, INR) with live exchange rates from [AwesomeAPI](https://docs.awesomeapi.com.br/api-de-moedas).
- **Transaction management** — Full create, edit, delete, and search/filter capabilities with monthly grouping.
- **Category management** — Customisable expense and income categories with icon and colour pickers; automatic default category seeding.
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

   Copy `.env.example` to `.env` and fill in your Turso credentials:

   ```sh
   cp .env.example .env
   ```

   ```dotenv
   TURSO_DATABASE_URL=libsql://your-database-name-org.turso.io
   TURSO_AUTH_TOKEN=your-turso-auth-token
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

## 🌐 Deploying to Vercel

1. **Import the repository into Vercel**
   - Push your changes to GitHub / GitLab / Bitbucket.
   - Go to [Vercel Dashboard](https://vercel.com/new) and select your repository.

2. **Configure Environment Variables in Vercel**
   - Add `TURSO_DATABASE_URL` (e.g. `libsql://your-database.turso.io`)
   - Add `TURSO_AUTH_TOKEN` (your Turso database auth token)

3. **Deploy**
   - Vercel automatically detects `vercel.json` and runs `npm run build` (`npx expo export -p web`).
   - The web app is served statically while database calls route dynamically through `/api/*` Vercel Functions.

## 🏗️ Project Architecture

```
finances-organiser/
├── api/                     # Vercel Serverless Functions
│   ├── _db.ts               # Server-side LibSQL client helper & table auto-migration
│   ├── health.ts            # GET /api/health — database ping & status check
│   ├── transactions.ts      # CRUD /api/transactions — fetch, create, edit, delete
│   └── categories.ts        # CRUD /api/categories — fetch, create, edit, delete, reset
│
├── App.tsx                  # Root component — tab navigation, top bar, modals
├── index.ts                 # Expo entry point (registerRootComponent)
├── app.json                 # Expo configuration
├── vercel.json              # Vercel deployment & rewrite rules
├── package.json
├── tsconfig.json
├── .env.example             # Environment variable template
│
├── assets/                  # App icons, splash screen, favicon
│
└── src/
    ├── types/
    │   └── index.ts         # Shared TypeScript interfaces (Transaction, TursoConfig, etc.)
    │
    ├── services/
    │   ├── tursoService.ts   # Client DB service — serverless API calls + offline fallback
    │   └── categoryService.ts# Category service — serverless API calls + offline fallback
    │
    ├── utils/
    │   └── currencies.ts     # Currency definitions, formatting, live exchange rates
    │
    ├── screens/
    │   ├── OverviewScreen.tsx          # Dashboard with balance summary and recent transactions
    │   ├── AnalyticsScreen.tsx         # D3 charts with currency filter
    │   ├── TransactionsScreen.tsx      # Searchable/filterable transaction history
    │   └── CategoryManagementScreen.tsx# Category editor with icon/colour pickers
    │
    └── components/
        ├── D3CurrentMonthCharts.tsx     # Donut chart + category bar chart (D3 + SVG)
        ├── D3EvolutionChart.tsx         # Monthly income/expense trend lines (D3 + SVG)
        ├── TransactionEditModal.tsx     # Add/edit transaction form
        ├── TursoConfigModal.tsx         # Turso credentials & connection tester
        ├── TransactionDatePicker.tsx    # Platform-resolved date picker barrel
        ├── TransactionDatePicker.native.tsx  # iOS/Android date picker
        └── TransactionDatePicker.web.tsx     # HTML5 date input for web
```

### Key Architectural Decisions

| Concern | Approach |
|---|---|
| **Serverless API Layer** | Vercel Node.js Serverless Functions in `/api` handle database CRUD operations securely using server-side Turso credentials. |
| **State management** | React `useState` / `useEffect` in the root `App` component; data flows down via props |
| **Navigation** | Manual tab router in `App.tsx` (tabs switch rendered screens) |
| **Data persistence** | Vercel Functions + Turso SQLite Cloud as primary store; `localStorage` as offline fallback |
| **Charting** | D3.js for data computation (`d3.pie`, `d3.arc`, `d3.curveMonotoneX`) rendered via `react-native-svg` paths |
| **Platform splits** | `.native.tsx` / `.web.tsx` file extensions for the date picker |
| **Currency conversion** | Pivot-based conversion through BRL using cached exchange rates (60 s TTL) |

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