# ColdVision MPP

On-chain wallet intelligence and Polymarket insider detection, powered by the Machine Payments Protocol (MPP).

## Setup

```bash
# Install dependencies
bun install

# Configure environment
cp server/.env.example server/.env
# Edit server/.env with your Supabase and MPP credentials

# Start the server
cd server && bun run dev

# Start the client (separate terminal)
cd client && bun run dev
```

### Environment Variables (server/.env)

| Variable | Description |
|---|---|
| `PORT` | Server port (default: 8080) |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anon/public key |
| `MPP_ADDRESS` | Wallet address that receives payments |

## API Routes

### Free

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/healthz` | Health check |
| `GET` | `/api/mpp/consumer/wallet` | Tempo wallet status |
| `GET` | `/api/mpp/consumer/services` | Discover MPP services |

### Paid (MPP-gated, returns 402 without payment)

| Method | Path | Price | Description |
|---|---|---|---|
| `GET` | `/api/mpp/supplier/potential-polymarket-insiders` | $0.03-$7.50 | Potential Polymarket insiders data feed (limited time pricing) |
| `GET` | `/api/mpp/supplier/wallet-intel` | $0.10 | Wallet intelligence lookup |
| `GET` | `/api/mpp/supplier/echo` | $0.001 | Echo service |
| `POST` | `/api/mpp/supplier/transform` | $0.005 | Uppercase transform |

### Consumer

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/mpp/consumer/call` | Call an external MPP service |

## Potential Polymarket Insiders

Returns potential Polymarket insider addresses with confidence scores, trade history, and bot detection.

**Headers:**
- `x-rows` - Number of rows (1-250, default: 250)
- `x-max-amount` - Budget in USD (calculates max rows)

```bash
tempo request "http://localhost:8080/api/mpp/supplier/potential-polymarket-insiders" -H "x-rows: 5"
```

## Wallet Intelligence

Takes a wallet address and returns an aggregated profile: EOA resolution, ENS identity, Twitter/X lookup, and trading metrics.

**Query params:**
- `address` - Wallet address (0x-prefixed, 40 hex chars)

```bash
tempo request "http://localhost:8080/api/mpp/supplier/wallet-intel?address=0x342c993db074cb2ebb39346ca885636b3cf37f7b"
```

**Response:**
```json
{
  "address": "0x...",
  "eoa": "0x...",
  "proxy": "0x...",
  "walletType": "safe",
  "handle": "username",
  "pseudonym": "Display Name",
  "profileImage": "https://...",
  "identity": {
    "ens": "name.eth",
    "twitter": "handle",
    "url": "https://...",
    "avatar": "https://..."
  },
  "twitter": {
    "username": "handle",
    "profileUrl": "https://x.com/handle",
    "found": true
  },
  "metrics": {
    "total_volume": 150000,
    "total_trades": 450,
    "total_markets": 25
  }
}
```

## Testing with Tempo CLI

```bash
# Install Tempo
curl -fsSL https://tempo.xyz/install | bash

# Login
tempo wallet login

# Dry run (preview cost)
tempo request --dry-run "https://coldvision-mpp-production.up.railway.app/api/mpp/supplier/potential-polymarket-insiders"

# Make a paid request
tempo request "https://coldvision-mpp-production.up.railway.app/api/mpp/supplier/potential-polymarket-insiders" -H "x-rows: 1"

# Wallet intelligence lookup
tempo request "https://coldvision-mpp-production.up.railway.app/api/mpp/supplier/wallet-intel?address=0x342c993db074cb2ebb39346ca885636b3cf37f7b"
```

If testing locally, replace `https://coldvision-mpp-production.up.railway.app` with `http://localhost:8080`.

> **Note:** Always wrap URLs containing `?` in quotes to prevent zsh glob expansion.

## Project Structure

```
coldvision-mpp/
  server/          Express API server (MPP-gated endpoints)
  client/          Vite + React frontend
  packages/
    db/            Supabase database layer
    api-zod/       API Zod schemas
    api-client-react/  Generated React Query client
    api-spec/      OpenAPI spec + Orval config
  scripts/         Utility scripts
```

## Deployment (Railway)

A `railway.json` is included at the repo root. Set the root directory to `/` in Railway, add your environment variables, and deploy. The healthcheck is at `/api/healthz`.

## Typecheck

```bash
bun run typecheck
```
