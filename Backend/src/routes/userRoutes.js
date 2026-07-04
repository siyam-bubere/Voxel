import { Router } from "express";
import { login, register } from "../controllers/userController.js";

const router = Router();

router.route("/login").post(login);
router.route("/register").post(register);

// Unimplemented route links commented out cleanly to avoid Express middleware routing map dropouts
// router.route("/add-to-activity").post(addToActivity);
// router.route("/get-all-activity").get(getAllActivity);

export default router;