import { type Request, type Response } from "express";
import { createSupplierRouter } from "./registerRoute";

const PAY_TO_ADDRESS =
  process.env["MPP_PAY_TO_ADDRESS"] ?? "0x0000000000000000000000000000000000000000";
const NETWORK = process.env["MPP_NETWORK"] ?? "base-sepolia";

export const supplierRouter = createSupplierRouter([
  {
    method: "get",
    path: "/echo",
    config: {
      price: "1000",
      network: NETWORK,
      asset: "USDC",
      payTo: PAY_TO_ADDRESS,
      description: "Echo service: returns the query string you send",
      maxTimeoutSeconds: 300,
    },
    handler: (req: Request, res: Response) => {
      res.json({ echo: req.query, timestamp: new Date().toISOString() });
    },
  },
  {
    method: "post",
    path: "/transform",
    config: {
      price: "5000",
      network: NETWORK,
      asset: "USDC",
      payTo: PAY_TO_ADDRESS,
      description: "Transform service: uppercases text in the request body",
      maxTimeoutSeconds: 300,
    },
    handler: (req: Request, res: Response) => {
      const body = req.body as Record<string, unknown>;
      const result: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(body)) {
        result[key] = typeof value === "string" ? value.toUpperCase() : value;
      }
      res.json({ result, timestamp: new Date().toISOString() });
    },
  },
]);
