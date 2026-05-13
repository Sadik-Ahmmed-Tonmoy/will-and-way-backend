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
    caretakerId: z.string().min(1, "Caretaker ID is required"),
    cashAllocation: z.number().positive("Cash allocation must be positive").optional(),
    notes: z.string().optional(),
  }),
});

const updatePetCaretakerValidationSchema = z.object({
  body: z.object({
    caretakerId: z.string().min(1, "Caretaker ID is required").optional(),
    cashAllocation: z.number().positive("Cash allocation must be positive").optional(),
    notes: z.string().optional(),
  }),
});



// ========== DISTRIBUTION VALIDATION ==========

const backupDistributorSchema = z.object({
  peopleId: z.string().optional(),
  charityName: z.string().optional(),
  charityUEN: z.string().optional(),
}).refine(data => data.peopleId || data.charityName, {
  message: "Either person or charity must be specified for backup distributor",
});

const distributionItemSchema = z.object({
  peopleId: z.string().optional(),
  charityName: z.string().optional(),
  charityUEN: z.string().optional(),
  distributionType: z.nativeEnum(DistributionType).optional(),
  notes: z.string().optional(),
  backupDistributors: z.array(backupDistributorSchema).optional(),
}).refine(data => data.peopleId || data.charityName, {
  message: "Either person or charity must be specified for distribution",
});

const addDistributionsValidationSchema = z.object({
  body: z.object({
    distributions: z.array(distributionItemSchema).min(1, "At least one distribution is required"),
  }),
});

const updateDistributionValidationSchema = z.object({
  body: z.object({
    peopleId: z.string().optional(),
    charityName: z.string().optional(),
    charityUEN: z.string().optional(),
    percentage: z.number().min(0).max(100).optional(),
    distributionType: z.nativeEnum(DistributionType).optional(),
    notes: z.string().optional(),
  }),
});

const addBackupDistributorValidationSchema = z.object({
  body: z.object({
    peopleId: z.string().optional(),
    charityName: z.string().optional(),
    charityUEN: z.string().optional(),
  }).refine(data => data.peopleId || data.charityName, {
    message: "Either person or charity must be specified",
  }),
});

const updateBackupDistributorValidationSchema = z.object({
  body: z.object({
    peopleId: z.string().optional(),
    charityName: z.string().optional(),
    charityUEN: z.string().optional(),
  }),
});

const bulkDistributionSchema = z.object({
  id: z.string().optional(),
  peopleId: z.string().optional(),
  charityName: z.string().optional(),
  charityUEN: z.string().optional(),
  distributionType: z.nativeEnum(DistributionType).optional(),
  notes: z.string().optional(),
  backupDistributors: z.array(z.object({
    id: z.string().optional(),
    peopleId: z.string().optional(),
    charityName: z.string().optional(),
    charityUEN: z.string().optional(),
  })).optional(),
});

const bulkUpdateDistributionsValidationSchema = z.object({
  body: z.object({
    distributions: z.array(bulkDistributionSchema).min(1, "At least one distribution is required"),
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
  addDistributionsValidationSchema,
  updateDistributionValidationSchema,
  addBackupDistributorValidationSchema,
  updateBackupDistributorValidationSchema,
  bulkUpdateDistributionsValidationSchema,
  
};