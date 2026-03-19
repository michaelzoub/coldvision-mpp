import { Router, type IRouter } from "express";
import healthRouter from "./health";
import mppRouter from "./mpp";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/mpp", mppRouter);

export default router;
