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

  const [domeResult, identityResult, backendResult] = await Promise.allSettled([
    resolveWallet(address),
    lookupIdentity(address),
    fetch(`${BACKEND_BASE}/get-insider-confidence`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${BACKEND_API_KEY}`,
      },
      body: JSON.stringify({ address }),
    }).then((r) => (r.ok ? r.json() : null)),
  ]);

  const dome = domeResult.status === "fulfilled" ? domeResult.value : null;
  const onChain =
    identityResult.status === "fulfilled" ? identityResult.value : null;
  const insiderData =
    backendResult.status === "fulfilled" ? backendResult.value : null;

  let twitter = null;
  const twitterHandle = onChain?.twitter ?? dome?.handle;
  if (twitterHandle) {
    try {
      twitter = await searchTwitterProfile(twitterHandle);
    } catch {
      // non-fatal
    }
  }

  const response: Record<string, unknown> = { address };

  const eoa = dome?.eoa;
  if (eoa && eoa !== address) response.eoa = eoa;
  if (dome?.proxy) response.proxy = dome.proxy;
  if (dome?.wallet_type) response.walletType = dome.wallet_type;
  if (dome?.handle) response.handle = dome.handle;
  if (dome?.pseudonym) response.pseudonym = dome.pseudonym;

  const profileImage = dome?.image ?? onChain?.avatar;
  if (profileImage) response.profileImage = profileImage;

  if (onChain && Object.values(onChain).some((v) => v !== null)) {
    response.identity = onChain;
  }

  if (twitter) response.twitter = twitter;
  if (dome?.wallet_metrics) response.metrics = dome.wallet_metrics;
  if (insiderData?.result) response.insider = insiderData.result;

  res.json(response);
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
