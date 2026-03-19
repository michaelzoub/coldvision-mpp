import { createPublicClient, http } from "viem";
import { normalize } from "viem/ens";
import { mainnet } from "viem/chains";

const client = createPublicClient({
  chain: mainnet,
  transport: http(),
});

export interface OnChainIdentity {
  ens: string | null;
  twitter: string | null;
  url: string | null;
  avatar: string | null;
}

export async function lookupIdentity(
  address: string,
): Promise<OnChainIdentity> {
  const result: OnChainIdentity = {
    ens: null,
    twitter: null,
    url: null,
    avatar: null,
  };

  try {
    const ensName = await client.getEnsName({
      address: address as `0x${string}`,
    });

    if (!ensName) return result;

    result.ens = ensName;

    const [twitter, url, avatar] = await Promise.allSettled([
      client.getEnsText({ name: normalize(ensName), key: "com.twitter" }),
      client.getEnsText({ name: normalize(ensName), key: "url" }),
      client.getEnsAvatar({ name: normalize(ensName) }),
    ]);

    if (twitter.status === "fulfilled" && twitter.value) {
      result.twitter = twitter.value;
    }
    if (url.status === "fulfilled" && url.value) {
      result.url = url.value;
    }
    if (avatar.status === "fulfilled" && avatar.value) {
      result.avatar = avatar.value;
    }
  } catch (err) {
    console.warn("[identityLookup] ENS resolution failed:", err);
  }

  return result;
}
