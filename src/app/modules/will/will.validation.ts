import { z } from "zod";
import { DistributionType, ExecutorType } from "@prisma/client";

const updateWillStatusValidationSchema = z.object({
  body: z.object({
    status: z.enum(["DRAFT", "COMPLETED", "EXECUTED", "REVOKED"]),
  }),
});

const updateWillStepValidationSchema = z.object({
  body: z.object({
    step: z.number().int().positive(),
    completedSteps: z.array(z.string()).optional(),
  }),
});

const addExecutorValidationSchema = z.object({
  body: z.object({
    peopleId: z.string().min(1, "Person ID is required"),
    // executorType: z.nativeEnum(ExecutorType),
    backupPeopleId: z.string().optional(),
  }),
});

const updateExecutorValidationSchema = z.object({
  body: z.object({
    peopleId: z.string().optional(),
    backupPeopleId: z.string().optional(),
  }),
});

const addEstateDistributionValidationSchema = z.object({
  body: z.object({
    peopleId: z.string().optional(),
    charityName: z.string().optional(),
    charityUEN: z.string().optional(),
    percentage: z.number().min(0).max(100, "Percentage must be between 0 and 100"),
    distributionType: z.nativeEnum(DistributionType),
    notes: z.string().optional(),
  }).refine(data => {
    return !!(data.peopleId || data.charityName);
  }, {
    message: "Either a person or charity must be specified",
  }),
});

const updateEstateDistributionValidationSchema = z.object({
  body: z.object({
    peopleId: z.string().optional(),
    charityName: z.string().optional(),
    charityUEN: z.string().optional(),
    percentage: z.number().min(0).max(100).optional(),
    notes: z.string().optional(),
  }),
});

const addWillGiftValidationSchema = z.object({
  body: z.object({
    giftId: z.string().min(1, "Gift ID is required"),
  }),
});

const addPetCaretakerValidationSchema = z.object({
  body: z.object({
    petId: z.string().min(1, "Pet ID is required"),
    caretakerId: z.string().min(1, "Caretaker ID is required"),
    cashAllocation: z.number().positive().optional(),
    notes: z.string().optional(),
  }),
});

const updatePetCaretakerValidationSchema = z.object({
  body: z.object({
    caretakerId: z.string().optional(),
    cashAllocation: z.number().positive().optional(),
    notes: z.string().optional(),
  }),
});

export const willValidation = {
  updateWillStatusValidationSchema,
  updateWillStepValidationSchema,
  addExecutorValidationSchema,
  updateExecutorValidationSchema,
  addEstateDistributionValidationSchema,
  updateEstateDistributionValidationSchema,
  addWillGiftValidationSchema,
  addPetCaretakerValidationSchema,
  updatePetCaretakerValidationSchema,
};