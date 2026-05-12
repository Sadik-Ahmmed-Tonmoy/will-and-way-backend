import { z } from "zod";
import { GiftType, RelationType } from "@prisma/client";

const recipientSchema = z.object({
  peopleId: z.string().min(1, "People ID is required"),
  relation: z.nativeEnum(RelationType).optional(),
  percentage: z.number().min(0).max(100).optional(),
});

const createGiftValidationSchema = z.object({
  body: z.object({
    giftType: z.nativeEnum(GiftType),
    amount: z.number().positive("Amount must be positive").optional(),
    itemName: z.string().min(1, "Item name is required").optional(),
    description: z.string().optional(),
    vehicleDetails: z.string().optional(),
    propertyAddress: z.string().optional(),
    financialAccountDetails: z.string().optional(),
    personalMessage: z.string().optional(),
    recipients: z.array(recipientSchema).min(1, "At least one recipient is required"),
  }).superRefine((data, ctx) => {
    // Validate required fields based on gift type
    if (data.giftType === GiftType.CASH && !data.amount) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["amount"],
        message: "Amount is required for cash gifts",
      });
    }

    if (
      (data.giftType === GiftType.ITEM || 
       data.giftType === GiftType.COLLECTION) && 
      !data.itemName
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["itemName"],
        message: "Item name is required for this gift type",
      });
    }

    if (data.giftType === GiftType.VEHICLE && !data.vehicleDetails) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["vehicleDetails"],
        message: "Vehicle details are required",
      });
    }

    if (data.giftType === GiftType.PROPERTY && !data.propertyAddress) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["propertyAddress"],
        message: "Property address is required",
      });
    }

    if (
      data.giftType === GiftType.FINANCIAL_ACCOUNT && 
      !data.financialAccountDetails
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["financialAccountDetails"],
        message: "Financial account details are required",
      });
    }

    // Validate total percentage doesn't exceed 100
    if (data.recipients && data.recipients.length > 0) {
      const totalPercentage = data.recipients.reduce(
        (sum, r) => sum + (r.percentage || 0), 
        0
      );
      if (totalPercentage > 100) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["recipients"],
          message: "Total percentage cannot exceed 100%",
        });
      }
    }
  }),
});

const updateGiftValidationSchema = z.object({
  body: z.object({
    amount: z.number().positive("Amount must be positive").optional(),
    itemName: z.string().min(1, "Item name is required").optional(),
    description: z.string().optional(),
    vehicleDetails: z.string().optional(),
    propertyAddress: z.string().optional(),
    financialAccountDetails: z.string().optional(),
    personalMessage: z.string().optional(),
    recipients: z.array(recipientSchema).min(1, "At least one recipient is required").optional(),
  }).superRefine((data, ctx) => {
    // Validate total percentage doesn't exceed 100
    if (data.recipients && data.recipients.length > 0) {
      const totalPercentage = data.recipients.reduce(
        (sum, r) => sum + (r.percentage || 0), 
        0
      );
      if (totalPercentage > 100) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["recipients"],
          message: "Total percentage cannot exceed 100%",
        });
      }
    }
  }),
});

export const giftValidation = {
  createGiftValidationSchema,
  updateGiftValidationSchema,
};