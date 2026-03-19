export interface PaymentRequirement {
  scheme: "x402";
  network: string;
  maxAmountRequired: string;
  resource: string;
  description: string;
  mimeType: string;
  payTo: string;
  maxTimeoutSeconds: number;
  asset: string;
  outputSchema?: Record<string, unknown>;
  extra?: Record<string, unknown>;
}

export interface PaymentPayload {
  x402Version: number;
  scheme: "x402";
  network: string;
  payload: {
    signature: string;
    authorization: {
      from: string;
      to: string;
      value: string;
      validAfter: string;
      validBefore: string;
      nonce: string;
    };
  };
}

export interface SettlementResult {
  success: boolean;
  txHash?: string;
  network?: string;
  payer?: string;
  error?: string;
}

export interface MPPRouteConfig {
  price: string;
  network?: string;
  asset?: string;
  payTo: string;
  description?: string;
  maxTimeoutSeconds?: number;
}
