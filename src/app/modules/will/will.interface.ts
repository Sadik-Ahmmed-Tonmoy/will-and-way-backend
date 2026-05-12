
import { DistributionType, ExecutorType } from "@prisma/client";

export interface IUpdateWillStatus {
  status: "DRAFT" | "COMPLETED" | "EXECUTED" | "REVOKED";
}

export interface IUpdateWillStep {
  step: number;
  completedSteps?: string[];
}

export interface IAddExecutor {
  peopleId: string;
  executorType: ExecutorType;
  backupPeopleId?: string;
}

export interface IUpdateExecutor {
  peopleId?: string;
  backupPeopleId?: string;
}

// export interface IAddEstateDistribution {
//   peopleId?: string;
//   charityName?: string;
//   charityUEN?: string;
//   percentage: number;
//   distributionType: DistributionType;
//   notes?: string;
// }

// export interface IUpdateEstateDistribution {
//   peopleId?: string;
//   charityName?: string;
//   charityUEN?: string;
//   percentage?: number;
//   notes?: string;
// }

export interface IAddWillGift {
  giftId: string;
}

export interface IAddPetCaretaker {
  petId: string;
  caretakerId: string;
  cashAllocation?: number;
  notes?: string;
}

export interface IUpdatePetCaretaker {
  caretakerId?: string;
  cashAllocation?: number;
  notes?: string;
}



// ========== DISTRIBUTION INTERFACES ==========

export interface IAddDistributions {
  distributions: {
    peopleId?: string;
    charityName?: string;
    charityUEN?: string;
    distributionType?: DistributionType;
    notes?: string;
    backupDistributors?: {
      peopleId?: string;
      charityName?: string;
      charityUEN?: string;
    }[];
  }[];
}

export interface IUpdateDistribution {
  peopleId?: string;
  charityName?: string;
  charityUEN?: string;
  percentage?: number;
  distributionType?: DistributionType;
  notes?: string;
}

export interface IAddBackupDistributor {
  peopleId?: string;
  charityName?: string;
  charityUEN?: string;
}

export interface IUpdateBackupDistributor {
  peopleId?: string;
  charityName?: string;
  charityUEN?: string;
}

export interface IBulkUpdateDistributions {
  distributions: {
    id?: string;           // If id provided, update existing. If not, create new
    peopleId?: string;
    charityName?: string;
    charityUEN?: string;
    distributionType?: DistributionType;
    notes?: string;
    backupDistributors?: {
      id?: string;         // If id provided, update existing. If not, create new
      peopleId?: string;
      charityName?: string;
      charityUEN?: string;
    }[];
  }[];
}