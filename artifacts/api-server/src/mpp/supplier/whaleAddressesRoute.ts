import { type RequestHandler, Router, type IRouter } from "express";
import { db, whaleAddressesTable } from "@workspace/db";
import { desc } from "drizzle-orm";
import { mppx, PRICE_PER_ROW, MAX_ROWS, MAX_CHARGE, PATHUSD, MPP_RECIPIENT } from "../mppxInstance";

function resolvePricingFromHeaders(
  rawRows?: string,
  rawAmount?: string,
): { rows: number; amount: string } {
  if (rawRows !== undefined) {
    const requested = Math.min(Math.max(1, parseInt(rawRows, 10) || 1), MAX_ROWS);
    const amount = (requested * PRICE_PER_ROW).toFixed(2);
    return { rows: requested, amount };
  }
  if (rawAmount !== undefined) {
    const budget = parseFloat(rawAmount) || PRICE_PER_ROW;
    const capped = Math.min(budget, MAX_CHARGE);
    const rows = Math.min(Math.floor(capped / PRICE_PER_ROW), MAX_ROWS);
    const amount = (rows * PRICE_PER_ROW).toFixed(2);
    return { rows: Math.max(rows, 1), amount };
  }
  return { rows: MAX_ROWS, amount: MAX_CHARGE.toFixed(2) };
}

const whaleDataHandler: RequestHandler = async (req, res) => {
  const { rows } = resolvePricingFromHeaders(
    req.headers["x-rows"] as string | undefined,
    req.headers["x-max-amount"] as string | undefined,
  );

  const data = await db
    .select()
    .from(whaleAddressesTable)
    .orderBy(desc(whaleAddressesTable.lastUpdatedAt))
    .limit(rows);

  res.json({
    count: data.length,
    rows: data,
    pricePerRow: PRICE_PER_ROW,
    totalCharged: (data.length * PRICE_PER_ROW).toFixed(2),
  });
};

function dynamicChargeMiddleware(): RequestHandler {
  return (req, res, next) => {
    const { amount, rows: rowCount } = resolvePricingFromHeaders(
      req.headers["x-rows"] as string | undefined,
      req.headers["x-max-amount"] as string | undefined,
    );
    const paymentMiddleware = mppx.charge({
      amount,
      currency: PATHUSD,
      recipient: MPP_RECIPIENT,
      description: `Whale addresses data feed — ${rowCount} rows @ $${PRICE_PER_ROW}/row`,
    }) as RequestHandler;
    paymentMiddleware(req, res, next);
  };
}

export const whaleAddressesRouter: IRouter = Router();

whaleAddressesRouter.get(
  "/whale-addresses",
  dynamicChargeMiddleware(),
  whaleDataHandler,
);
