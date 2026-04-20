# Aurelia Mobile — Android Setup

## Prerequisites
- Node.js 18+
- Android Studio with an emulator (API 26+)
- Expo CLI: `npm install -g expo-cli eas-cli`

## Install & Run

```bash
cd mobile
npm install
npm run android        # launches on connected emulator / device
```

## Backend URL

Edit `src/lib/api.ts` → `BACKEND_URL`:

| Environment             | URL                        |
|-------------------------|----------------------------|
| Android emulator        | `http://10.0.2.2:8080`     |
| Physical device (LAN)   | `http://192.168.x.x:8080`  |
| Production              | `https://your-domain.com`  |

## Build APK (local)

```bash
# Requires Android SDK + Gradle locally
expo run:android --variant release
```

## Build APK (cloud via EAS)

```bash
eas login
eas build --platform android --profile preview
```
The generated `.apk` link will appear in the terminal and at expo.dev.

## Manual Transaction Endpoint

The app POSTs to `POST /api/transactions` with:

```json
{
  "txnDate":     "2026-04-19",
  "description": "Grocery run",
  "merchant":    "Carrefour",
  "categoryId":  1,
  "amount":      42.50
}
```

Ensure your backend `TransactionResource` handles this endpoint.

## Screens

| Screen       | Route        | Description                              |
|--------------|--------------|------------------------------------------|
| Login        | Auth stack   | JWT login with AsyncStorage persistence  |
| Register     | Auth stack   | New account creation                     |
| Dashboard    | Tab 1        | Stats, pie chart, recent transactions    |
| Transactions | Tab 2        | Full list, search, category filter, FAB  |
| Insights     | Tab 3        | Forecast bar chart + anomaly detection   |
