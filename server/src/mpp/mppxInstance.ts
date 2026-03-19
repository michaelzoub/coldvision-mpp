import { Mppx, tempo } from "mppx/express";

export const USDC = "0x20c000000000000000000000b9537d11c60e8b50" as const;

export const MPP_RECIPIENT =
  (process.env["MPP_RECIPIENT_ADDRESS"] as `0x${string}` | undefined) ??
  (process.env["MPP_ADDRESS"] as `0x${string}` | undefined) ??
  "0x0000000000000000000000000000000000000001";

export const mppx = Mppx.create({
  methods: [
    tempo({
      currency: USDC,
      recipient: MPP_RECIPIENT,
    }),
  ],
});

export const PRICE_PER_ROW = 0.03;
export const MAX_ROWS = 250;
export const MAX_CHARGE = PRICE_PER_ROW * MAX_ROWS;
