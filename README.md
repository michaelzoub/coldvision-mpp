# ColdVision MPP

On-chain wallet intelligence and whale address data, powered by the Machine Payments Protocol (MPP).

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
| `MPP_SECRET_KEY` | Private key for fee sponsorship (0x-prefixed) |
| `MPP_ADDRESS` | Wallet address that receives payments |
| `MPP_TESTNET` | Set to `false` for mainnet (default: true) |

## API Routes

### Free

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/healthz` | Health check |
| `GET` | `/api/mpp/supplier/echo/payment-info` | Payment info for echo |
| `GET` | `/api/mpp/supplier/transform/payment-info` | Payment info for transform |
| `GET` | `/api/mpp/consumer/wallet` | Tempo wallet status |
| `GET` | `/api/mpp/consumer/services` | Discover MPP services |

### Paid (MPP-gated, returns 402 without payment)

| Method | Path | Price | Description |
|---|---|---|---|
| `GET` | `/api/mpp/supplier/echo` | $0.001 | Echo service (returns query string) |
| `POST` | `/api/mpp/supplier/transform` | $0.005 | Uppercase transform |
| `GET` | `/api/mpp/supplier/whale-addresses` | $0.10-$25.00 | Whale address data feed |
| `GET` | `/api/mpp/supplier/wallet-intel` | $0.50 | Wallet intelligence lookup |

### Consumer

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/mpp/consumer/call` | Call an external MPP service |

## Whale Addresses

Returns whale address data with confidence scores, trade history, and bot detection.

**Headers:**
- `x-rows` - Number of rows (1-250, default: 250)
- `x-max-amount` - Budget in USD (calculates max rows)

```bash
mppx "http://localhost:8080/api/mpp/supplier/whale-addresses" -H "x-rows: 5"
```

## Wallet Intelligence

Takes a wallet address and returns an aggregated profile: EOA resolution, ENS identity, Twitter/X lookup, and trading metrics.

**Query params:**
- `address` - Wallet address (0x-prefixed, 40 hex chars)

```bash
mppx "http://localhost:8080/api/mpp/supplier/wallet-intel?address=0x342c993db074cb2ebb39346ca885636b3cf37f7b"
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

## Testing with mppx CLI

```bash
# Install mppx
npm install -g mppx

# Create a funded account
mppx account create

# Inspect a paid endpoint (no payment)
mppx --inspect "http://localhost:8080/api/mpp/supplier/wallet-intel?address=0x342c993db074cb2ebb39346ca885636b3cf37f7b"

# Make a paid request
mppx "http://localhost:8080/api/mpp/supplier/wallet-intel?address=0x342c993db074cb2ebb39346ca885636b3cf37f7b"
```

## Testing with Tempo CLI

```bash
# Install Tempo
curl -fsSL https://tempo.xyz/install | bash

# Login
tempo wallet login

# Dry run (preview cost)
tempo request --dry-run "http://localhost:8080/api/mpp/supplier/whale-addresses"

# Make a paid request
tempo request "http://localhost:8080/api/mpp/supplier/whale-addresses" -H "x-rows: 1"
```

> **Note:** Always wrap URLs containing `?` in quotes to prevent zsh glob expansion.

## Typecheck

```bash
bun run typecheck
```
