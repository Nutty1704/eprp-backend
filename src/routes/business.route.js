import express from "express";
import multer from "multer";
import { jwtCheck, jwtParse } from "../middleware/auth.middleware.js";
import MyBusinessController from "../controllers/business.controller.js";
import { validateMyBusinessRequest } from "../middleware/validation.middleware.js";

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

router.get("/", jwtCheck, jwtParse, MyBusinessController.getMyBusiness);

router.post(
  "/",
  upload.single("imageFile"),
  validateMyBusinessRequest,
  jwtCheck,
  jwtParse,
  MyBusinessController.createMyBusiness
);

router.put(
  "/",
  upload.single("imageFile"),
  validateMyBusinessRequest,
  jwtCheck,
  jwtParse,
  MyBusinessController.updateMyBusiness
);

export default router;