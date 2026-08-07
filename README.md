# FinanceCloud

A cross-platform personal finance tracker built with **React Native** and **Expo**. It connects to a [Turso](https://turso.tech/) SQLite cloud database for persistent storage while providing an offline-first local fallback via `localStorage`. The app features interactive D3.js charts, multi-currency support with live exchange rates, and full CRUD for transactions and categories.

## ✨ Features

- **Dashboard overview** — Net balance, monthly income/expense summary, and recent activity at a glance.
- **D3.js analytics** — Interactive donut charts, category breakdown bars, and monthly trend line/area charts rendered with `react-native-svg`.
- **Multi-currency** — 9 supported currencies (BRL, USD, EUR, GBP, CAD, AUD, JPY, CHF, INR) with live exchange rates from the [AwesomeAPI](https://docs.awesomeapi.com.br/api-de-moedas).
- **Transaction management** — Full create, edit, delete, and search/filter capabilities with monthly grouping.
- **Category management** — Customisable expense and income categories with icon and colour pickers; reset to defaults at any time.
- **Turso Cloud sync** — Automatic two-way sync with a Turso SQLite cloud database. Falls back gracefully to local browser storage when offline.
- **Cross-platform** — Runs on Web, Android, and iOS via Expo.

## 📋 Prerequisites

- [Node.js](https://nodejs.org/) (LTS recommended)
- [Expo CLI](https://docs.expo.dev/get-started/installation/) (installed globally or via `npx`)
- *(Optional)* A [Turso](https://turso.tech/) database for cloud persistence

## 🚀 Installation

1. **Clone the repository**

   ```sh
   git clone git@github.com:boa50/finances-organiser.git
   cd finances-organiser
   ```

2. **Install dependencies**

   ```sh
   npm install
   ```

3. **Configure environment variables** *(optional)*

   Copy the example file and fill in your Turso credentials:

   ```sh
   cp .env.example .env
   ```

   ```dotenv
   EXPO_PUBLIC_TURSO_DATABASE_URL=libsql://your-database-name-org.turso.io
   EXPO_PUBLIC_TURSO_AUTH_TOKEN=your-turso-auth-token
   ```

   > If these variables are omitted, the app will prompt you to enter them at runtime through the in-app Turso configuration modal. You can also skip Turso entirely and use local storage only.

## ▶️ Getting Started

Start the Expo development server:

```sh
# Start in default mode (presents a QR code + options)
npm start

# Start directly for a specific platform
npm run web
npm run android
npm run ios
```

On first launch the app will:
1. Attempt to connect to Turso if credentials are available.
2. Automatically populate default expense and income categories if the categories table is empty.
3. Fetch the latest currency exchange rates.

## 🏗️ Project Architecture

```
finances-organiser/
├── App.tsx                  # Root component — tab navigation, top bar, modals
├── index.ts                 # Expo entry point (registerRootComponent)
├── app.json                 # Expo configuration
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
    │   ├── tursoService.ts   # Turso DB client — CRUD, sync, offline fallback
    │   └── categoryService.ts# Category CRUD with local cache + cloud sync
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
| **State management** | React `useState` / `useEffect` in the root `App` component; data flows down via props |
| **Navigation** | Manual tab router in `App.tsx` (no React Navigation router — tabs switch rendered screens) |
| **Data persistence** | Turso SQLite cloud as primary store; `localStorage` as transparent offline fallback |
| **Charting** | D3.js for data computation (`d3.pie`, `d3.arc`, `d3.curveMonotoneX`) rendered via `react-native-svg` paths |
| **Platform splits** | `.native.tsx` / `.web.tsx` file extensions for the date picker, resolved automatically by Metro bundler |
| **Currency conversion** | Pivot-based conversion through BRL using cached exchange rates (60 s TTL) |

## 📚 Useful Documentation

| Resource | Link |
|---|---|
| Expo Documentation | https://docs.expo.dev/ |
| React Native | https://reactnative.dev/docs/getting-started |
| Turso (libSQL) | https://docs.turso.tech/ |
| D3.js | https://d3js.org/ |
| React Native SVG | https://github.com/software-mansion/react-native-svg |
| Lucide Icons (React Native) | https://lucide.dev/guide/packages/lucide-react-native |
| AwesomeAPI (Exchange Rates) | https://docs.awesomeapi.com.br/api-de-moedas |
| React Native Community DateTimePicker | https://github.com/react-native-datetimepicker/datetimepicker |

## 📄 License

This project is distributed under the [MIT License](LICENSE).