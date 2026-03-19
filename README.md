mppx

The mppx CLI is a lightweight MPP client bundled with the mppx package. It is designed for simple use cases and debugging during development.

Install

npm
pnpm
bun
npm install -g mppx

Create an account

mppx account create

Make a paid request

mppx https://mpp.dev/api/ping/paid


# Health check (no payment needed)
curl http://localhost:8080/api/healthz

# Check payment info for whale addresses
curl http://localhost:8080/api/mpp/supplier/echo/payment-info

# Hit a paid endpoint (tempo handles the 402 → payment → retry flow)
tempo request http://localhost:8080/api/mpp/supplier/echo?hello=world

# Whale addresses (dynamic pricing)
tempo request http://localhost:8080/api/mpp/supplier/whale-addresses \
  -H "x-rows: 5"

# Dry run (preview cost without paying)
tempo request --dry-run http://localhost:8080/api/mpp/supplier/whale-addresses
