import express from "express";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { GiftController } from "./gift.controller";
import { giftValidation } from "./gift.validation";

const router = express.Router();

// Create a new gift
router.post(
  "/",
  auth(),
  validateRequest(giftValidation.createGiftValidationSchema),
  GiftController.createGift
);

// Get all gifts for the user
router.get(
  "/",
  auth(),
  GiftController.getGifts
);

// Get gift by ID
router.get(
  "/:id",
  auth(),
  GiftController.getGiftById
);

// Update a gift
router.put(
  "/:id",
  auth(),
  validateRequest(giftValidation.updateGiftValidationSchema),
  GiftController.updateGift
);

// Delete a gift
router.delete(
  "/:id",
  auth(),
  GiftController.deleteGift
);

// Get gifts by type
router.get(
  "/type/:giftType",
  auth(),
  GiftController.getGiftsByType
);

export const GiftRoutes = router;