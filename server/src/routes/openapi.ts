import { type Request, type Response } from "express";
import { PRICE_PER_ROW, MAX_ROWS, MAX_CHARGE } from "../mpp/mppxInstance";

const openapiDocument = {
  openapi: "3.1.0",
  info: {
    title: "ColdVision API",
    version: "1.0.0",
    description:
      "ColdVision provides on-chain intelligence for Polymarket. It exposes payment-gated endpoints for retrieving potential insider whale addresses and detailed wallet intelligence lookups.",
    guidance:
      "Use GET /api/mpp/supplier/potential-polymarket-insiders to retrieve a feed of whale addresses suspected of insider activity on Polymarket. Control the number of rows via the x-rows header (1-250) or set a budget via x-max-amount header. Use GET /api/mpp/supplier/wallet-intel?address=0x... to get detailed intelligence on a specific wallet address including on-chain identity, social profiles, and insider confidence scores.",
  },
  "x-discovery": {
    ownershipProofs: [],
  },
  paths: {
    "/api/mpp/supplier/potential-polymarket-insiders": {
      get: {
        operationId: "getPotentialPolymarketInsiders",
        summary:
          "Potential Polymarket Insiders - Whale address feed with insider activity signals",
        tags: ["Polymarket Intelligence"],
        "x-payment-info": {
          pricingMode: "range",
          minPrice: PRICE_PER_ROW.toFixed(6),
          maxPrice: MAX_CHARGE.toFixed(6),
          protocols: ["mpp"],
        },
        requestBody: {
          required: false,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  rows: {
                    type: "integer",
                    minimum: 1,
                    maximum: MAX_ROWS,
                    description: `Number of rows to return (1-${MAX_ROWS}). Price is $${PRICE_PER_ROW}/row. Pass via x-rows header.`,
                  },
                  maxAmount: {
                    type: "number",
                    minimum: PRICE_PER_ROW,
                    maximum: MAX_CHARGE,
                    description:
                      "Maximum USD budget. Rows returned will fit within this budget. Pass via x-max-amount header.",
                  },
                },
              },
            },
          },
        },
        parameters: [
          {
            name: "x-rows",
            in: "header",
            required: false,
            schema: { type: "integer", minimum: 1, maximum: MAX_ROWS },
            description: `Number of rows to return (1-${MAX_ROWS}). Price is $${PRICE_PER_ROW}/row.`,
          },
          {
            name: "x-max-amount",
            in: "header",
            required: false,
            schema: {
              type: "number",
              minimum: PRICE_PER_ROW,
              maximum: MAX_CHARGE,
            },
            description:
              "Maximum USD budget. Rows returned will fit within this budget.",
          },
        ],
        responses: {
          "200": {
            description: "Successful response with whale address data",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    count: {
                      type: "integer",
                      description: "Number of rows returned",
                    },
                    rows: {
                      type: "array",
                      items: { type: "object" },
                      description: "Whale address records",
                    },
                    pricePerRow: {
                      type: "number",
                      description: "Price per row in USD",
                    },
                    totalCharged: {
                      type: "string",
                      description: "Total amount charged in USD",
                    },
                  },
                  required: ["count", "rows", "pricePerRow", "totalCharged"],
                },
              },
            },
          },
          "402": { description: "Payment Required" },
        },
      },
    },
    "/api/mpp/supplier/wallet-intel": {
      get: {
        operationId: "getWalletIntel",
        summary:
          "Wallet Intelligence - Detailed on-chain identity and insider confidence for a wallet",
        tags: ["Wallet Intelligence"],
        "x-payment-info": {
          pricingMode: "fixed",
          price: "0.100000",
          protocols: ["mpp"],
        },
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  address: {
                    type: "string",
                    pattern: "^0x[0-9a-fA-F]{40}$",
                    description:
                      "Ethereum address to look up (0x-prefixed, 40 hex characters). Pass as query parameter: ?address=0x...",
                  },
                },
                required: ["address"],
              },
            },
          },
        },
        parameters: [
          {
            name: "address",
            in: "query",
            required: true,
            schema: {
              type: "string",
              pattern: "^0x[0-9a-fA-F]{40}$",
            },
            description:
              "Ethereum address to look up (0x-prefixed, 40 hex characters)",
          },
        ],
        responses: {
          "200": {
            description: "Successful wallet intelligence response",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    address: {
                      type: "string",
                      description: "The queried address",
                    },
                    eoa: {
                      type: "string",
                      description:
                        "Externally owned account if different from queried address",
                    },
                    walletType: { type: "string" },
                    handle: { type: "string" },
                    pseudonym: { type: "string" },
                    profileImage: { type: "string" },
                    identity: {
                      type: "object",
                      description: "On-chain identity information",
                    },
                    twitter: {
                      type: "object",
                      description: "Twitter profile information",
                    },
                    metrics: {
                      type: "object",
                      description: "Wallet metrics and statistics",
                    },
                    insider: {
                      type: "object",
                      description: "Insider confidence scoring",
                    },
                  },
                  required: ["address"],
                },
              },
            },
          },
          "400": {
            description: "Invalid address parameter",
          },
          "402": { description: "Payment Required" },
        },
      },
    },
  },
};

export const openapiHandler = (_req: Request, res: Response) => {
  res.json(openapiDocument);
};
