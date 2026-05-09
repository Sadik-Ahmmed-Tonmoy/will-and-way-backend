import { z } from "zod";
import { MaritalStatus, maritalStatus, Region, RelationType, Religion, TypeOfIdentifier } from "@prisma/client";

const updateProfileValidationSchema = z.object({
  body: z.object({
    fullName: z.string().min(1, "Full name is required").optional(),
    nickname: z.string().min(1, "Nickname is required").optional(),
    phoneNumber: z.string().optional(),
    region:  z.nativeEnum(Region).optional(),
    religion: z.nativeEnum(Religion).optional(),
    maritalStatus: z.nativeEnum(MaritalStatus).optional(),
    profileImage: z.string().optional(),
  }),
});

const addPersonValidationSchema = z.object({
  body: z.object({
    fullName: z.string().min(1, "Full name is required"),
    email: z.string().email("Invalid email").optional().nullable(),
    typeOfIdentifier: z.nativeEnum(TypeOfIdentifier).optional().nullable(),
    identifierValue: z.string().optional().nullable(),
    dateOfBirth: z.string().optional().nullable(),
    relationWithUser: z.nativeEnum(RelationType).optional().nullable(),
    governmentIssuedId: z.boolean().optional().default(false),
    relationType: z.nativeEnum(RelationType),
  }).superRefine((data, ctx) => {
    // For PET type - no additional validation needed
    if (data.relationType === RelationType.PET) {
      return;
    }

    // For CHILD type - dateOfBirth is always required
    if (data.relationType === RelationType.CHILD && !data.dateOfBirth) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["dateOfBirth"],
        message: "Date of birth is required for children",
      });
    }

    // If user explicitly set governmentIssuedId to false (no government ID)
    // Then relationWithUser and dateOfBirth are required
    // if (data.governmentIssuedId === false) {
    //   if (!data.relationWithUser) {
    //     ctx.addIssue({
    //       code: z.ZodIssueCode.custom,
    //       path: ["relationWithUser"],
    //       message: "Relation with user is required when no government ID is provided",
    //     });
    //   }
    //   if (!data.dateOfBirth) {
    //     ctx.addIssue({
    //       code: z.ZodIssueCode.custom,
    //       path: ["dateOfBirth"],
    //       message: "Date of birth is required when no government ID is provided",
    //     });
    //   }
    // }

    // If user provided typeOfIdentifier, then identifierValue is required too
    if (data.typeOfIdentifier && !data.identifierValue) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["identifierValue"],
        message: "Identifier value is required when type of identifier is provided",
      });
    }

    // If user provided identifierValue, then typeOfIdentifier is required too
    if (data.identifierValue && !data.typeOfIdentifier) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["typeOfIdentifier"],
        message: "Type of identifier is required when identifier value is provided",
      });
    }
  }),
});

const updatePersonValidationSchema = z.object({
  body: z.object({
    fullName: z.string().min(1, "Full name is required").optional(),
    email: z.string().email("Invalid email").optional().nullable(),
    typeOfIdentifier: z.nativeEnum(TypeOfIdentifier).optional().nullable(),
    identifierValue: z.string().optional().nullable(),
    dateOfBirth: z.string().optional().nullable(),
    relationWithUser: z.nativeEnum(RelationType).optional().nullable(),
    governmentIssuedId: z.boolean().optional(),
  }),
});

const addAddressValidationSchema = z.object({
  body: z.object({
    country: z.string().min(1, "Country is required"),
    streetAddress: z.string().min(1, "Street address is required"),
    unitNumber: z.string().optional(),
    postCode: z.string().min(1, "Post code is required"),
  }),
});

const updateAddressValidationSchema = z.object({
  body: z.object({
    country: z.string().min(1, "Country is required"),
    streetAddress: z.string().min(1, "Street address is required"),
    unitNumber: z.string().optional(),
    postCode: z.string().min(1, "Post code is required"),
  }),
});

export const profileValidation = {
  updateProfileValidationSchema,
  addPersonValidationSchema,
  updatePersonValidationSchema,
  addAddressValidationSchema,
  updateAddressValidationSchema,
};