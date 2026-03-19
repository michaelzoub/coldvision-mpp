import { type RequestHandler, Router, type IRouter } from "express";
import { mppx, PATHUSD, MPP_RECIPIENT } from "../mppxInstance";
import { resolveWallet } from "../../utils/domeApi";
import { lookupIdentity } from "../../utils/identityLookup";
import { searchTwitterProfile } from "../../utils/twitterSearch";

const PRICE_PER_LOOKUP = "0.050";

const ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/;

const walletIntelHandler: RequestHandler = async (req, res) => {
  const address = req.query["address"] as string | undefined;

  if (!address || !ADDRESS_RE.test(address)) {
    res.status(400).json({
      error:
        "Valid address query parameter required (0x-prefixed, 40 hex chars)",
    });
    return;
  }

  const [domeResult, identity] = await Promise.allSettled([
    resolveWallet(address),
    lookupIdentity(address),
  ]);

  const dome = domeResult.status === "fulfilled" ? domeResult.value : null;
  const onChain = identity.status === "fulfilled" ? identity.value : null;

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
  });
};

export const walletIntelRouter: IRouter = Router();

walletIntelRouter.get(
  "/wallet-intel",
  mppx.charge({
    amount: PRICE_PER_LOOKUP,
    currency: PATHUSD,
    recipient: MPP_RECIPIENT,
    description: `Wallet intelligence lookup - $${PRICE_PER_LOOKUP}/request`,
  }) as RequestHandler,
  walletIntelHandler,
);
