import express from "express";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { WillController } from "./will.controller";
import { willValidation } from "./will.validation";

const router = express.Router();

// ========== WILL BASICS ==========
router.post("/", auth(), WillController.createWill);

router.get("/", auth(), WillController.getMyWill);

router.get("/full", auth(), WillController.getFullWill);

router.put(
  "/status",
  auth(),
  validateRequest(willValidation.updateWillStatusValidationSchema),
  WillController.updateWillStatus
);

router.put(
  "/step",
  auth(),
  validateRequest(willValidation.updateWillStepValidationSchema),
  WillController.updateWillStep
);

// ========== EXECUTORS ==========
router.post(
  "/executors",
  auth(),
  validateRequest(willValidation.addExecutorValidationSchema),
  WillController.addExecutor
);

router.put(
  "/executors/:id",
  auth(),
  validateRequest(willValidation.updateExecutorValidationSchema),
  WillController.updateExecutor
);

router.delete("/executors/:id", auth(), WillController.deleteExecutor);

// Delete person from executor (remove person reference from executor)
router.delete(
  "/executors/person/:peopleId",
  auth(),
  WillController.removePersonFromExecutor
);



// ========== ESTATE DISTRIBUTIONS ==========
router.post(
  "/distributions",
  auth(),
  validateRequest(willValidation.addEstateDistributionValidationSchema),
  WillController.addEstateDistribution
);

router.put(
  "/distributions/:id",
  auth(),
  validateRequest(willValidation.updateEstateDistributionValidationSchema),
  WillController.updateEstateDistribution
);

router.delete("/distributions/:id", auth(), WillController.deleteEstateDistribution);

// ========== WILL GIFTS ==========
router.post(
  "/gifts",
  auth(),
  validateRequest(willValidation.addWillGiftValidationSchema),
  WillController.addWillGift
);

router.delete("/gifts/:id", auth(), WillController.deleteWillGift);

// ========== PET CARETAKERS ==========
router.post(
  "/pet-caretakers",
  auth(),
  validateRequest(willValidation.addPetCaretakerValidationSchema),
  WillController.addPetCaretaker
);

router.put(
  "/pet-caretakers/:id",
  auth(),
  validateRequest(willValidation.updatePetCaretakerValidationSchema),
  WillController.updatePetCaretaker
);

router.delete("/pet-caretakers/:id", auth(), WillController.deletePetCaretaker);

export const WillRoutes = router;