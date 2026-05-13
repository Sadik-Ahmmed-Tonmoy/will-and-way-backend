import express from "express";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { WillController } from "./will.controller";
import { willValidation } from "./will.validation";

const router = express.Router();

// ========== WILL BASICS ==========
router.get('/dashboard', auth(), WillController.getDashboard);

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
// Add caretaker to ALL pets
router.post(
  "/pet-caretakers",
  auth(),
  validateRequest(willValidation.addPetCaretakerValidationSchema),
  WillController.addPetCaretaker
);

// Get all pet caretakers
router.get(
  "/pet-caretakers",
  auth(),
  WillController.getPetCaretakers
);

// Update all pet caretakers (bulk update)
router.put(
  "/pet-caretakers",
  auth(),
  validateRequest(willValidation.updatePetCaretakerValidationSchema),
  WillController.updatePetCaretaker
);

// Delete all pet caretakers
router.delete(
  "/pet-caretakers",
  auth(),
  WillController.deletePetCaretaker
);

// ========== DISTRIBUTIONS (Updated) ==========

router.get("/distributions", auth(), WillController.getAllDistributions);

// Add multiple distributions (auto-calculate percentages)
router.post(
  "/distributions/bulk",
  auth(),
  validateRequest(willValidation.addDistributionsValidationSchema),
  WillController.addDistributions
);

// Bulk update distributions (add/update/remove in one call)
router.put(
  "/distributions/bulk",
  auth(),
  validateRequest(willValidation.bulkUpdateDistributionsValidationSchema),
  WillController.bulkUpdateDistributions
);

// Add single distribution (auto-calculate percentage)
router.post(
  "/distributions",
  auth(),
  validateRequest(willValidation.addDistributionsValidationSchema),
  WillController.addDistributions
);


// Delete distribution
router.delete(
  "/distributions/:id",
  auth(),
  WillController.deleteEstateDistribution
);

// ========== BACKUP DISTRIBUTORS ==========

// Add backup distributor to a distribution
router.post(
  "/distributions/:distributionId/backup",
  auth(),
  validateRequest(willValidation.addBackupDistributorValidationSchema),
  WillController.addBackupDistributor
);

// Update backup distributor
router.put(
  "/distributions/backup/:id",
  auth(),
  validateRequest(willValidation.updateBackupDistributorValidationSchema),
  WillController.updateBackupDistributor
);

// Delete backup distributor
router.delete(
  "/distributions/backup/:id",
  auth(),
  WillController.deleteBackupDistributor
);

export const WillRoutes = router;