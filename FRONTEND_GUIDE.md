# Frontend Integration Guide

How to call ColdVision's MPP-gated API endpoints from your website or app.

## Install

```bash
bun add mppx viem
```

## Option 1: Polyfill fetch (simplest)

Polyfill the global `fetch` once at app startup. All subsequent `fetch` calls automatically handle 402 payment challenges.

```ts
import { Mppx, tempo } from "mppx/client";
import { privateKeyToAccount } from "viem/accounts";

// Initialize once at app startup
Mppx.create({
  methods: [
    tempo({
      account: privateKeyToAccount("0xYOUR_PRIVATE_KEY"),
    }),
  ],
});

// Now fetch works with paid endpoints automatically
const res = await fetch(
  "https://your-server.com/api/mpp/supplier/wallet-intel?address=0x342c..."
);
const data = await res.json();
```

## Option 2: Bound fetch (no global polyfill)

If you don't want to modify the global `fetch`:

```ts
import { Mppx, tempo } from "mppx/client";
import { privateKeyToAccount } from "viem/accounts";

const mppx = Mppx.create({
  polyfill: false,
  methods: [
    tempo({
      account: privateKeyToAccount("0xYOUR_PRIVATE_KEY"),
    }),
  ],
});

// Use mppx.fetch instead of global fetch
const res = await mppx.fetch(
  "https://your-server.com/api/mpp/supplier/wallet-intel?address=0x342c..."
);
const data = await res.json();
```

## Option 3: Wagmi connector (for wallet-connected apps)

If your app already uses Wagmi for wallet connections:

```ts
import { Mppx, tempo } from "mppx/client";
import { getConnectorClient, createConfig, http } from "wagmi";
import { tempoModerato } from "mppx/chains";

const config = createConfig({
  chains: [tempoModerato],
  transports: {
    [tempoModerato.id]: http(),
  },
});

Mppx.create({
  methods: [
    tempo({
      getClient: (parameters) => getConnectorClient(config, parameters),
    }),
  ],
});
```

Users pay from their connected wallet -- no private key needed in your code.

## Option 4: Manual payment handling (full control)

Show a confirmation UI before paying:

```ts
import { Mppx, tempo } from "mppx/client";
import { privateKeyToAccount } from "viem/accounts";

const mppx = Mppx.create({
  polyfill: false,
  methods: [tempo()],
});

// 1. Make initial request -- gets 402
const response = await fetch(
  "https://your-server.com/api/mpp/supplier/wallet-intel?address=0x342c..."
);

if (response.status === 402) {
  // 2. Show user the cost, get confirmation
  // 3. Create payment credential
  const credential = await mppx.createCredential(response, {
    account: privateKeyToAccount("0xYOUR_PRIVATE_KEY"),
  });

  // 4. Retry with payment
  const paidResponse = await fetch(
    "https://your-server.com/api/mpp/supplier/wallet-intel?address=0x342c...",
    { headers: { Authorization: credential } }
  );

  const data = await paidResponse.json();
}
```

## Payment Receipts

Every successful paid response includes a receipt:

```ts
import { Receipt } from "mppx";

const response = await fetch("https://your-server.com/api/mpp/supplier/wallet-intel?address=0x...");
const receipt = Receipt.fromResponse(response);

console.log(receipt.status);    // "success"
console.log(receipt.reference); // "0xtx789abc..."
console.log(receipt.timestamp); // "2025-01-15T12:00:00Z"
```

## React Example

```tsx
import { useState } from "react";

// Assumes Mppx.create was called at app startup (Option 1 or 2)

function WalletLookup() {
  const [address, setAddress] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleLookup() {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/mpp/supplier/wallet-intel?address=${address}`
      );
      setResult(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <input
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        placeholder="0x..."
      />
      <button onClick={handleLookup} disabled={loading}>
        {loading ? "Looking up..." : "Lookup Wallet"}
      </button>
      {result && <pre>{JSON.stringify(result, null, 2)}</pre>}
    </div>
  );
}
```

## Endpoints Reference

| Method | Path | Price | Description |
|---|---|---|---|
| `GET` | `/api/mpp/supplier/potential-polymarket-insiders` | $0.10-$25.00 | Potential Polymarket insiders data feed |
| `GET` | `/api/mpp/supplier/wallet-intel?address=0x...` | $0.50 | Wallet intelligence lookup |
| `GET` | `/api/mpp/supplier/echo` | $0.001 | Echo service |
| `POST` | `/api/mpp/supplier/transform` | $0.005 | Uppercase transform |
| `GET` | `/api/healthz` | Free | Health check |
