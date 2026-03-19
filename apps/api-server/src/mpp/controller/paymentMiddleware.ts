import { type Request, type Response, type NextFunction } from "express";
import type { PaymentRequirement, PaymentPayload, SettlementResult, MPPRouteConfig } from "./types";

const X402_VERSION = 1;
const DEFAULT_NETWORK = "base-sepolia";
const DEFAULT_ASSET = "USDC";
const DEFAULT_TIMEOUT = 300;

function buildPaymentRequired(
  req: Request,
  config: MPPRouteConfig,
): PaymentRequirement {
  const resource = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
  return {
    scheme: "x402",
    network: config.network ?? DEFAULT_NETWORK,
    maxAmountRequired: config.price,
    resource,
    description: config.description ?? `Access to ${req.path}`,
    mimeType: "application/json",
    payTo: config.payTo,
    maxTimeoutSeconds: config.maxTimeoutSeconds ?? DEFAULT_TIMEOUT,
    asset: config.asset ?? DEFAULT_ASSET,
  };
}

function decodePaymentHeader(header: string): PaymentPayload | null {
  try {
    const decoded = Buffer.from(header, "base64").toString("utf8");
    return JSON.parse(decoded) as PaymentPayload;
  } catch {
    return null;
  }
}

async function settlePayment(
  payment: PaymentPayload,
  requirement: PaymentRequirement,
): Promise<SettlementResult> {
  if (!payment.payload?.authorization?.from) {
    return { success: false, error: "Missing authorization.from" };
  }

  const value = BigInt(payment.payload.authorization.value ?? "0");
  const required = BigInt(requirement.maxAmountRequired);

  if (value < required) {
    return {
      success: false,
      error: `Insufficient payment: got ${value}, required ${required}`,
    };
  }

  const now = Math.floor(Date.now() / 1000);
  const validAfter = Number(payment.payload.authorization.validAfter ?? 0);
  const validBefore = Number(payment.payload.authorization.validBefore ?? 0);

  if (now < validAfter) {
    return { success: false, error: "Payment authorization not yet valid" };
  }
  if (now > validBefore) {
    return { success: false, error: "Payment authorization expired" };
  }

  return {
    success: true,
    txHash: `simulated-${Date.now()}`,
    network: requirement.network,
    payer: payment.payload.authorization.from,
  };
}

export function requirePayment(config: MPPRouteConfig) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const paymentHeader = req.headers["x-payment"] as string | undefined;

    const requirement = buildPaymentRequired(req, config);

    if (!paymentHeader) {
      res.status(402).json({
        x402Version: X402_VERSION,
        error: "Payment Required",
        accepts: [requirement],
      });
      return;
    }

    const payment = decodePaymentHeader(paymentHeader);

    if (!payment) {
      res.status(402).json({
        x402Version: X402_VERSION,
        error: "Invalid X-Payment header: could not decode base64 JSON",
        accepts: [requirement],
      });
      return;
    }

    if (payment.x402Version !== X402_VERSION) {
      res.status(402).json({
        x402Version: X402_VERSION,
        error: `Unsupported x402Version: ${payment.x402Version}`,
        accepts: [requirement],
      });
      return;
    }

    const settlement = await settlePayment(payment, requirement);

    if (!settlement.success) {
      res.status(402).json({
        x402Version: X402_VERSION,
        error: settlement.error ?? "Payment settlement failed",
        accepts: [requirement],
      });
      return;
    }

    res.setHeader("X-Payment-Response", JSON.stringify({
      success: true,
      txHash: settlement.txHash,
      network: settlement.network,
      payer: settlement.payer,
    }));

    next();
  };
}

export function paymentInfo(config: MPPRouteConfig) {
  return (req: Request, res: Response) => {
    const requirement = buildPaymentRequired(req, config);
    res.json({
      x402Version: X402_VERSION,
      accepts: [requirement],
    });
  };
}
