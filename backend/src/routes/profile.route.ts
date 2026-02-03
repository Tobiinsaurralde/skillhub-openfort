import express from "express";
import {
    createUpdateProfile,
    getProfile,
    getProfileStats,
    getTopSellers,
    toggleFavorite,
} from "../controllers/profile.controller";
import upload from "../config/multer";

const router = express.Router();

router.post("/", upload.single("image"), createUpdateProfile);
router.put("/", upload.single("image"), createUpdateProfile);
router.post("/favorites/:walletAddress", toggleFavorite);
router.get("/top", getTopSellers);
router.get("/:walletAddress", getProfile);
router.get("/stats/:walletAddress", getProfileStats);

export default router;
