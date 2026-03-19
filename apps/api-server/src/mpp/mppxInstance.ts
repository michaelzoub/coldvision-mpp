import { Mppx, tempo } from "mppx/express";

export const PATHUSD = "0x20c0000000000000000000000000000000000000" as const;

export const MPP_RECIPIENT =
  (process.env["MPP_RECIPIENT_ADDRESS"] as `0x${string}` | undefined) ??
  "0x0000000000000000000000000000000000000001";

const TESTNET = process.env["MPP_TESTNET"] !== "false";

const secretKey = process.env["MPP_SECRET_KEY"] as `0x${string}` | undefined;

if (!secretKey) {
  throw new Error(
    "MPP_SECRET_KEY is required. Set it via environment variables.",
  );
}

export const mppx = Mppx.create({
  secretKey,
  methods: [
    TESTNET
      ? tempo({ testnet: true, currency: PATHUSD, recipient: MPP_RECIPIENT })
      : tempo({ currency: PATHUSD, recipient: MPP_RECIPIENT }),
  ],
});

export const PRICE_PER_ROW = 0.10;
export const MAX_ROWS = 250;
export const MAX_CHARGE = PRICE_PER_ROW * MAX_ROWS;
