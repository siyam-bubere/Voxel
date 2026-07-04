import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { createMeeting, verifyMeeting } from "../controllers/meetingController.js";

const router = express.Router();

router.post("/create", protect, createMeeting);
router.get("/verify/:meetingCode", protect, verifyMeeting);

export default router;