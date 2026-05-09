import express from "express";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { AssetController } from "./asset.controller";
import { assetValidation } from "./asset.validation";

const router = express.Router();

// ========== PROPERTY ROUTES ==========
router.post(
  "/properties",
  auth(),
  validateRequest(assetValidation.createPropertyValidationSchema),
  AssetController.createProperty
);

router.get(
  "/properties",
  auth(),
  AssetController.getProperties
);

router.get(
  "/properties/:id",
  auth(),
  AssetController.getPropertyById
);

router.put(
  "/properties/:id",
  auth(),
  validateRequest(assetValidation.updatePropertyValidationSchema),
  AssetController.updateProperty
);

router.delete(
  "/properties/:id",
  auth(),
  AssetController.deleteProperty
);

router.get(
  "/properties/type/:propertyType",
  auth(),
  AssetController.getPropertiesByType
);

// ========== ASSET ROUTES (Bank, Investment, Retirement, Insurance, Business, Safe Deposit, Crypto) ==========
router.post(
  "/assets",
  auth(),
  validateRequest(assetValidation.createAssetValidationSchema),
  AssetController.createAsset
);

router.get(
  "/assets",
  auth(),
  AssetController.getAssets
);

router.get(
  "/assets/:id",
  auth(),
  AssetController.getAssetById
);

router.put(
  "/assets/:id",
  auth(),
  validateRequest(assetValidation.updateAssetValidationSchema),
  AssetController.updateAsset
);

router.delete(
  "/assets/:id",
  auth(),
  AssetController.deleteAsset
);

router.get(
  "/assets/type/:assetType",
  auth(),
  AssetController.getAssetsByType
);

// ========== LOAN ROUTES ==========
router.post(
  "/loans",
  auth(),
  validateRequest(assetValidation.createLoanValidationSchema),
  AssetController.createLoan
);

router.get(
  "/loans",
  auth(),
  AssetController.getLoans
);

router.get(
  "/loans/:id",
  auth(),
  AssetController.getLoanById
);

router.put(
  "/loans/:id",
  auth(),
  validateRequest(assetValidation.updateLoanValidationSchema),
  AssetController.updateLoan
);

router.delete(
  "/loans/:id",
  auth(),
  AssetController.deleteLoan
);

router.get(
  "/loans/type/:loanType",
  auth(),
  AssetController.getLoansByType
);

// ========== ADVISOR ROUTES ==========
router.post(
  "/advisors",
  auth(),
  validateRequest(assetValidation.createAdvisorValidationSchema),
  AssetController.createAdvisor
);

router.get(
  "/advisors",
  auth(),
  AssetController.getAdvisors
);

router.get(
  "/advisors/:id",
  auth(),
  AssetController.getAdvisorById
);

router.put(
  "/advisors/:id",
  auth(),
  validateRequest(assetValidation.updateAdvisorValidationSchema),
  AssetController.updateAdvisor
);

router.delete(
  "/advisors/:id",
  auth(),
  AssetController.deleteAdvisor
);

export const AssetRoutes = router;