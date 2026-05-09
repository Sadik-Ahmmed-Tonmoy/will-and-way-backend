import { GiftType, RelationType } from "@prisma/client";

export interface ICreateGift {
  giftType: GiftType;
  amount?: number;                          // For cash gifts
  itemName?: string;                        // For items, collections, vehicles
  description?: string;                     // For collections, items
  vehicleDetails?: string;                  // Vehicle make, model, registration
  propertyAddress?: string;                 // Property address
  financialAccountDetails?: string;         // Bank account details
  personalMessage?: string;
  recipients: IRecipient[];
}

export interface IRecipient {
  peopleId: string;
  relation: RelationType;
  percentage?: number;
}

export interface IUpdateGift {
  amount?: number;
  itemName?: string;
  description?: string;
  vehicleDetails?: string;
  propertyAddress?: string;
  financialAccountDetails?: string;
  personalMessage?: string;
  recipients?: IRecipient[];
}

export interface IAddCharityRecipient {
  giftId: string;
  charityName: string;
  charityRegistrationNumber?: string;
  percentage?: number;
}