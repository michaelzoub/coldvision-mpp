import { Router, type IRouter, type RequestHandler } from "express";
import { requirePayment, paymentInfo } from "../controller/paymentMiddleware";
import type { MPPRouteConfig } from "../controller/types";

export interface SupplierRouteDefinition {
  method: "get" | "post" | "put" | "patch" | "delete";
  path: string;
  config: MPPRouteConfig;
  handler: RequestHandler;
}

export function registerPaidRoute(
  router: IRouter,
  definition: SupplierRouteDefinition,
): void {
  const { method, path, config, handler } = definition;

  router.get(`${path}/payment-info`, paymentInfo(config));

  router[method](path, requirePayment(config), handler);
}

export function createSupplierRouter(
  routes: SupplierRouteDefinition[],
): IRouter {
  const router = Router();
  for (const route of routes) {
    registerPaidRoute(router, route);
  }
  return router;
}
