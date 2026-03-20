import { type RequestHandler, Router, type IRouter } from "express";
import { mppx, USDC, MPP_RECIPIENT } from "../mppxInstance";
import { resolveWallet } from "../../utils/domeApi";
import { lookupIdentity } from "../../utils/identityLookup";
import { searchTwitterProfile } from "../../utils/twitterSearch";

const PRICE_PER_LOOKUP = "0.100";

const ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/;

const BACKEND_BASE = "https://polytics-backend-production-fd1c.up.railway.app";
const BACKEND_API_KEY = process.env["POLYTICS_API_KEY"] ?? "";

const walletIntelHandler: RequestHandler = async (req, res) => {
  const address = req.query["address"] as string | undefined;

  if (!address || !ADDRESS_RE.test(address)) {
    res.status(400).json({
      error:
        "Valid address query parameter required (0x-prefixed, 40 hex chars)",
    });
    return;
  }

  const params = new URLSearchParams({ address });

  const [domeResult, identityResult, backendResult] = await Promise.allSettled([
    resolveWallet(address),
    lookupIdentity(address),
    fetch(`${BACKEND_BASE}/get-insider-confidence?${params}`, {
      headers: { "x-api-key": BACKEND_API_KEY },
    }).then((r) => (r.ok ? r.json() : null)),
  ]);

  const dome = domeResult.status === "fulfilled" ? domeResult.value : null;
  const onChain = identityResult.status === "fulfilled" ? identityResult.value : null;
  const insiderData = backendResult.status === "fulfilled" ? backendResult.value : null;

  let twitter = null;
  const twitterHandle = onChain?.twitter ?? dome?.handle;
  if (twitterHandle) {
    try {
      twitter = await searchTwitterProfile(twitterHandle);
    } catch {
      // non-fatal
    }
  }

  res.json({
    address,
    eoa: dome?.eoa ?? address,
    proxy: dome?.proxy ?? null,
    walletType: dome?.wallet_type ?? null,
    handle: dome?.handle ?? null,
    pseudonym: dome?.pseudonym ?? null,
    profileImage: dome?.image ?? onChain?.avatar ?? null,
    identity: onChain,
    twitter,
    metrics: dome?.wallet_metrics ?? null,
    ...insiderData,
  });
};

export const walletIntelRouter: IRouter = Router();

walletIntelRouter.get(
  "/wallet-intel",
  mppx.charge({
    amount: PRICE_PER_LOOKUP,
    currency: USDC,
    recipient: MPP_RECIPIENT,
    description: `Wallet intelligence lookup - $${PRICE_PER_LOOKUP}/request`,
  }) as RequestHandler,
  walletIntelHandler,
);
