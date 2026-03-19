const DOME_API_BASE = "https://api.domeapi.io/v1";

export interface DomeWallet {
  eoa: string;
  proxy: string;
  wallet_type: string;
  handle: string | null;
  pseudonym: string | null;
  image: string | null;
  wallet_metrics?: {
    total_volume: number;
    total_trades: number;
    total_markets: number;
    highest_volume_day?: {
      date: string;
      volume: number;
      trades: number;
    };
    merges: number;
    splits: number;
    conversions: number;
    redemptions: number;
  };
}

export async function resolveWallet(
  address: string,
): Promise<DomeWallet | null> {
  const params = new URLSearchParams({
    eoa: address,
    with_metrics: "true",
  });

  const res = await fetch(`${DOME_API_BASE}/polymarket/wallet?${params}`);

  if (res.status === 404) return null;

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Dome API error ${res.status}: ${body}`);
  }

  return (await res.json()) as DomeWallet;
}
