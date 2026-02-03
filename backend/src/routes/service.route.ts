import { Router } from "express";
import { upload } from "../middleware/upload.middleware";
import {
  createService,
  getServices,
  getServiceById,
} from "../controllers/service.controller";

import { syncAgents } from "../controllers/agent.controller";

const router = Router();

router.post("/sync-agents", syncAgents);
router.post("/", upload.single("imageFile"), createService);
router.get("/", getServices);
router.get("/:id", getServiceById);
export default router;
