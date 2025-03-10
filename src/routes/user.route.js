import express from "express";
import UserController from "../controllers/user.controller.js";
import { jwtCheck, jwtParse, jwtParseNoUserCheck } from "../middleware/auth.middleware.js";
import { validateUserCreationRequest, validateUserUpdateRequest } from "../middleware/validation.middleware.js";

const router = express.Router();

// Check if user exists
router.get("/check", jwtCheck, jwtParseNoUserCheck, UserController.checkUser);

// Create new user
router.post("/", jwtCheck, validateUserCreationRequest, UserController.createUser);

// Get current user profile
router.get("/", jwtCheck, jwtParse, UserController.getCurrentUser);

// Update user profile
router.put("/", jwtCheck, jwtParse, validateUserUpdateRequest, UserController.updateUser);

export default router;