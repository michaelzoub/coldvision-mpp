import { Router, type IRouter, type Request, type Response } from "express";
import { supplierRouter } from "../mpp/supplier/supplierRouter";
import { whaleAddressesRouter } from "../mpp/supplier/whaleAddressesRoute";
import {
  consumeService,
  discoverServices,
  getWalletStatus,
} from "../mpp/consumer/tempoConsumer";

const router: IRouter = Router();

router.use("/supplier", supplierRouter);
router.use("/supplier", whaleAddressesRouter);

router.get("/consumer/wallet", async (_req: Request, res: Response) => {
  const result = await getWalletStatus();
  if (!result.success) {
    res.status(502).json({ error: result.error });
    return;
  }
  res.json(result.data);
});

router.get("/consumer/services", async (req: Request, res: Response) => {
  const search = req.query["search"] as string | undefined;
  const result = await discoverServices(search);
  if (!result.success) {
    res.status(502).json({ error: result.error });
    return;
  }
  res.json(result.data);
});

router.post("/consumer/call", async (req: Request, res: Response) => {
  const { serviceId, path: servicePath, method, body, dryRun } = req.body as {
    serviceId: string;
    path: string;
    method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    body?: unknown;
    dryRun?: boolean;
  };

  if (!serviceId || !servicePath) {
    res.status(400).json({ error: "serviceId and path are required" });
    return;
  }

  const result = await consumeService(serviceId, servicePath, {
    method,
    body,
    dryRun,
  });

  if (!result.success) {
    res.status(502).json({ error: result.error });
    return;
  }

  res.json(result.data);
});

export default router;
