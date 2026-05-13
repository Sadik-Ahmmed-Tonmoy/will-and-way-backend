import { WillStatus } from '@prisma/client';
import httpStatus from 'http-status';
import ApiError from '../../../errors/ApiErrors';
import prisma from '../../../shared/prisma';
import {
  IUpdateWillStep,
  IAddExecutor,
  IUpdateExecutor,

  IAddWillGift,
  IAddPetCaretaker,
  IUpdatePetCaretaker,
} from './will.interface';
import { calculateAutoPercentages } from '../../utils/calculateAutoPercentages';

// ========== WILL SERVICES ==========

const createWill = async (userId: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError(httpStatus.NOT_FOUND, 'User not found');

  const existingWill = await prisma.will.findUnique({ where: { userId } });
  if (existingWill) throw new ApiError(httpStatus.BAD_REQUEST, 'Will already exists');

  const will = await prisma.will.create({
    data: {
      userId,
      status: WillStatus.DRAFT,
      completedSteps: [],
      currentStep: 1,
    },
  });

  return will;
};

const getMyWill = async (userId: string) => {
  const will = await prisma.will.findUnique({
    where: { userId },
    include: {
      executors: {
        include: {
          person: {
            select: { id: true, fullName: true, email: true, relationType: true },
          },
          backupPerson: {
            select: { id: true, fullName: true, email: true },
          },
        },
      },
      estateDistributions: {
        include: {
          person: {
            select: { id: true, fullName: true, email: true },
          },
        },
      },
      willGifts: {
        include: {
          gift: {
            include: {
              recipients: {
                include: {
                  recipient: {
                    select: { id: true, fullName: true },
                  },
                },
              },
            }
          }
        },
      },
      petCaretakers: {
        include: {
          pet: {
            select: { id: true, fullName: true },
          },
          caretaker: {
            select: { id: true, fullName: true, email: true },
          },
        },
      },
    },
  });

  if (!will) throw new ApiError(httpStatus.NOT_FOUND, 'Will not found');
  return will;
};

const getFullWill = async (userId: string) => {
  const will = await prisma.will.findUnique({
    where: { userId },
    include: {
      executors: {
        include: {
          person: true,
          backupPerson: true,
        },
      },
      estateDistributions: {
        include: {
          person: true,
        },
      },
      willGifts: {
        include: {
          gift: {
            include: {
              recipients: {
                include: {
                  recipient: true,
                },
              },
            },
          },
        },
      },
      petCaretakers: {
        include: {
          pet: true,
          caretaker: true,
        },
      },
    },
  });

  if (!will) throw new ApiError(httpStatus.NOT_FOUND, 'Will not found');

  const properties = await prisma.property.count({ where: { userId } });
  const assets = await prisma.asset.count({ where: { userId } });
  const loans = await prisma.loan.count({ where: { userId } });

  return {
    ...will,
    assetSummary: {
      properties,
      financialAssets: assets,
      otherAssets: loans,
    },
  };
};

const updateWillStatus = async (userId: string, status: string) => {
  const will = await prisma.will.findUnique({ where: { userId } });
  if (!will) throw new ApiError(httpStatus.NOT_FOUND, 'Will not found');

  return prisma.will.update({
    where: { userId },
    data: { status: status as WillStatus },
  });
};

const updateWillStep = async (userId: string, payload: IUpdateWillStep) => {
  const will = await prisma.will.findUnique({ where: { userId } });
  if (!will) throw new ApiError(httpStatus.NOT_FOUND, 'Will not found');

  return prisma.will.update({
    where: { userId },
    data: {
      currentStep: payload.step,
      completedSteps: payload.completedSteps || will.completedSteps,
    },
  });
};

// ========== EXECUTOR SERVICES ==========

const addExecutor = async (userId: string, payload: IAddExecutor) => {
  const will = await prisma.will.findUnique({ where: { userId } });
  if (!will) throw new ApiError(httpStatus.NOT_FOUND, 'Will not found');

  const existing = await prisma.executor.findFirst({
    where: { willId: will.id },
  });
  if (existing) throw new ApiError(httpStatus.BAD_REQUEST, `Executor already exists`);

  const person = await prisma.people.findFirst({ where: { id: payload.peopleId, userId } });
  if (!person) throw new ApiError(httpStatus.NOT_FOUND, 'Person not found');

  if (payload.backupPeopleId) {
    const backupPerson = await prisma.people.findFirst({ where: { id: payload.backupPeopleId, userId } });
    if (!backupPerson) throw new ApiError(httpStatus.NOT_FOUND, 'Backup person not found');
  }

  return prisma.executor.create({
    data: {
      willId: will.id,
      peopleId: payload.peopleId,
      //   executorType: payload.executorType,
      backupPeopleId: payload.backupPeopleId,
    },
    include: {
      person: { select: { id: true, fullName: true, email: true, relationType: true, } },
      backupPerson: { select: { id: true, fullName: true, email: true, relationType: true } },
    },
  });
};

const updateExecutor = async (userId: string, executorId: string, payload: IUpdateExecutor) => {
  const will = await prisma.will.findUnique({ where: { userId } });
  if (!will) throw new ApiError(httpStatus.NOT_FOUND, 'Will not found');

  const executor = await prisma.executor.findFirst({ where: { id: executorId, willId: will.id } });
  if (!executor) throw new ApiError(httpStatus.NOT_FOUND, 'Executor not found');

  console.log(executorId);
  if (payload.peopleId) {
    const person = await prisma.people.findFirst({ where: { id: payload.peopleId, userId } });
    if (!person) throw new ApiError(httpStatus.NOT_FOUND, 'Person not found');
  }

  //   if (payload.backupPeopleId) {
  //     const backupPerson = await prisma.people.findFirst({ where: { id: payload.backupPeopleId, userId } });
  //     if (!backupPerson) throw new ApiError(httpStatus.NOT_FOUND, 'Backup person not found');
  //   }

  return prisma.executor.update({
    where: { id: executorId },
    data: payload,
    include: {
      person: { select: { id: true, fullName: true, email: true, relationType: true } },
      backupPerson: { select: { id: true, fullName: true, email: true, relationType: true } },
    },
  });
};

const deleteExecutor = async (userId: string, executorId: string) => {
  const will = await prisma.will.findUnique({ where: { userId } });
  if (!will) throw new ApiError(httpStatus.NOT_FOUND, 'Will not found');

  const executor = await prisma.executor.findFirst({ where: { id: executorId, willId: will.id } });
  if (!executor) throw new ApiError(httpStatus.NOT_FOUND, 'Executor not found');

  await prisma.executor.delete({ where: { id: executorId } });
  return { id: executorId, deleted: true };
};




// Remove person from executor (change the person, keep executor)
const removePersonFromExecutor = async (userId: string, peopleId: string) => {
  console.log('Removing person from executor:', { userId, peopleId });

  const will = await prisma.will.findUnique({ where: { userId } });
  if (!will) throw new ApiError(httpStatus.NOT_FOUND, 'Will not found');

  // Find all executors where this person is either main or backup
  const executorsAsMain = await prisma.executor.findMany({
    where: { willId: will.id, peopleId },
  });

  const executorsAsBackup = await prisma.executor.findMany({
    where: { willId: will.id, backupPeopleId: peopleId },
  });

  // Remove person from main executor role
  for (const executor of executorsAsMain) {
    await prisma.executor.update({
      where: { id: executor.id },
      data: {
        peopleId: null, // This will fail due to required field, so delete instead
      },
    });
  }

  // Remove person from backup executor role
  for (const executor of executorsAsBackup) {
    await prisma.executor.update({
      where: { id: executor.id },
      data: {
        backupPeopleId: null,
      },
    });
  }

  return {
    removedAsMain: executorsAsMain.length,
    removedAsBackup: executorsAsBackup.length,
    deleted: false,
  };
};

// ========== ESTATE DISTRIBUTION SERVICES ==========

// ========== DISTRIBUTION SERVICES ==========

// Calculate auto percentages based on number of recipients
// const calculateAutoPercentages = (count: number): number => {
//   if (count === 0) return 0;
//   return parseFloat((100 / count).toFixed(2));
// };

const getAllDistributions = async (userId: string) => {
  const will = await prisma.will.findUnique({ where: { userId } });
  if (!will) throw new ApiError(httpStatus.NOT_FOUND, 'Will not found');

  return prisma.estateDistribution.findMany({
    where: { willId: will.id },
    include: {
      person: { select: { id: true, fullName: true, email: true } },
      backupDistributors: {
        include: {
          person: { select: { id: true, fullName: true, email: true } },
        },
      },
    },
  });
};

// Add multiple distributions with auto-calculated percentages
const addDistributions = async (userId: string, distributions: any[]) => {
  const will = await prisma.will.findUnique({ where: { userId } });
  if (!will) throw new ApiError(httpStatus.NOT_FOUND, 'Will not found');

  // Delete existing distributions first (replace all)
  await prisma.estateDistribution.deleteMany({ where: { willId: will.id } });

  // Auto-calculate percentage
  const percentage = calculateAutoPercentages(distributions.length);

  // Validate all people first
  for (const dist of distributions) {
    if (dist.peopleId) {
      const person = await prisma.people.findFirst({ where: { id: dist.peopleId, userId } });
      if (!person) throw new ApiError(httpStatus.NOT_FOUND, `Person with ID ${dist.peopleId} not found`);
    }
  }

  // Create all distributions
  const createdDistributions = await prisma.$transaction(
    distributions.map((dist, index) =>
      prisma.estateDistribution.create({
        data: {
          willId: will.id,
          peopleId: dist.peopleId || null,
          charityName: dist.charityName || null,
          charityUEN: dist.charityUEN || null,
          percentage: percentage,
          distributionType: dist.distributionType || 'PERCENTAGE',
          order: index + 1,
          notes: dist.notes,
          backupDistributors: dist.backupDistributors?.length > 0 ? {
            create: dist.backupDistributors.map((backup: any) => ({
              peopleId: backup.peopleId || null,
              charityName: backup.charityName || null,
              charityUEN: backup.charityUEN || null,
            })),
          } : undefined,
        },
        include: {
          person: { select: { id: true, fullName: true, email: true } },
          backupDistributors: {
            include: {
              person: { select: { id: true, fullName: true, email: true } },
            },
          },
        },
      })
    )
  );

  return {
    distributions: createdDistributions,
    totalCount: createdDistributions.length,
    autoPercentage: percentage,
    totalPercentage: percentage * createdDistributions.length,
  };
};

// Bulk update distributions (replace all)
const bulkUpdateDistributions = async (userId: string, distributions: any[]) => {
  const will = await prisma.will.findUnique({ where: { userId } });
  if (!will) throw new ApiError(httpStatus.NOT_FOUND, 'Will not found');

  // Delete all existing distributions
  await prisma.estateDistribution.deleteMany({ where: { willId: will.id } });

  // Auto-calculate percentage
  const percentage = calculateAutoPercentages(distributions.length);

  // Create new distributions
  const createdDistributions = await prisma.$transaction(
    distributions.map((dist, index) =>
      prisma.estateDistribution.create({
        data: {
          willId: will.id,
          peopleId: dist.peopleId || null,
          charityName: dist.charityName || null,
          charityUEN: dist.charityUEN || null,
          percentage: dist.percentage || percentage,
          distributionType: dist.distributionType || 'PERCENTAGE',
          order: index + 1,
          notes: dist.notes,
          backupDistributors: dist.backupDistributors?.length > 0 ? {
            create: dist.backupDistributors.map((backup: any) => ({
              peopleId: backup.peopleId || null,
              charityName: backup.charityName || null,
              charityUEN: backup.charityUEN || null,
            })),
          } : undefined,
        },
        include: {
          person: { select: { id: true, fullName: true, email: true } },
          backupDistributors: {
            include: {
              person: { select: { id: true, fullName: true, email: true } },
            },
          },
        },
      })
    )
  );

  return {
    distributions: createdDistributions,
    totalCount: createdDistributions.length,
    autoPercentage: percentage,
  };
};

// Add backup distributor
const addBackupDistributor = async (userId: string, distributionId: string, payload: any) => {
  const will = await prisma.will.findUnique({ where: { userId } });
  if (!will) throw new ApiError(httpStatus.NOT_FOUND, 'Will not found');

  const distribution = await prisma.estateDistribution.findFirst({
    where: { id: distributionId, willId: will.id },
  });

  if (!distribution) throw new ApiError(httpStatus.NOT_FOUND, 'Distribution not found');

  if (payload.peopleId) {
    const person = await prisma.people.findFirst({ where: { id: payload.peopleId, userId } });
    if (!person) throw new ApiError(httpStatus.NOT_FOUND, 'Person not found');
  }

  const backup = await prisma.backupDistributor.create({
    data: {
      distributionId,
      peopleId: payload.peopleId || null,
      charityName: payload.charityName || null,
      charityUEN: payload.charityUEN || null,
    },
    include: {
      person: { select: { id: true, fullName: true, email: true } },
    },
  });

  return backup;
};

// Update backup distributor
const updateBackupDistributor = async (userId: string, backupId: string, payload: any) => {
  const will = await prisma.will.findUnique({ where: { userId } });
  if (!will) throw new ApiError(httpStatus.NOT_FOUND, 'Will not found');

  const backup = await prisma.backupDistributor.findFirst({
    where: { id: backupId },
    include: { distribution: true },
  });

  if (!backup || backup.distribution.willId !== will.id) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Backup distributor not found');
  }

  if (payload.peopleId) {
    const person = await prisma.people.findFirst({ where: { id: payload.peopleId, userId } });
    if (!person) throw new ApiError(httpStatus.NOT_FOUND, 'Person not found');
  }

  return prisma.backupDistributor.update({
    where: { id: backupId },
    data: payload,
    include: {
      person: { select: { id: true, fullName: true, email: true } },
    },
  });
};

// Delete backup distributor
const deleteBackupDistributor = async (userId: string, backupId: string) => {
  const will = await prisma.will.findUnique({ where: { userId } });
  if (!will) throw new ApiError(httpStatus.NOT_FOUND, 'Will not found');

  const backup = await prisma.backupDistributor.findFirst({
    where: { id: backupId },
    include: { distribution: true },
  });

  if (!backup || backup.distribution.willId !== will.id) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Backup distributor not found');
  }

  await prisma.backupDistributor.delete({ where: { id: backupId } });
  return { id: backupId, deleted: true };
};



const deleteEstateDistribution = async (userId: string, distributionId: string) => {
  const will = await prisma.will.findUnique({ where: { userId } });
  if (!will) throw new ApiError(httpStatus.NOT_FOUND, 'Will not found');

  const distribution = await prisma.estateDistribution.findFirst({ where: { id: distributionId, willId: will.id } });
  if (!distribution) throw new ApiError(httpStatus.NOT_FOUND, 'Distribution not found');

  await prisma.estateDistribution.delete({ where: { id: distributionId } });
  return { id: distributionId, deleted: true };
};




// ========== WILL GIFT SERVICES ==========

const addWillGift = async (userId: string, payload: IAddWillGift) => {
  const will = await prisma.will.findUnique({ where: { userId } });
  if (!will) throw new ApiError(httpStatus.NOT_FOUND, 'Will not found');

  const gift = await prisma.gift.findFirst({ where: { id: payload.giftId, userId } });
  if (!gift) throw new ApiError(httpStatus.NOT_FOUND, 'Gift not found');

  const existing = await prisma.willGift.findFirst({ where: { willId: will.id, giftId: payload.giftId } });
  if (existing) throw new ApiError(httpStatus.BAD_REQUEST, 'Gift already added to will');

  return prisma.willGift.create({
    data: {
      willId: will.id,
      giftId: payload.giftId,
    },
    include: {
      gift: {
        include: {
          recipients: {
            include: {
              recipient: { select: { id: true, fullName: true } },
            },
          },
        },
      },
    },
  });
};

const deleteWillGift = async (userId: string, willGiftId: string) => {
  const will = await prisma.will.findUnique({ where: { userId } });
  if (!will) throw new ApiError(httpStatus.NOT_FOUND, 'Will not found');

  const willGift = await prisma.willGift.findFirst({ where: { id: willGiftId, willId: will.id } });
  if (!willGift) throw new ApiError(httpStatus.NOT_FOUND, 'Will gift not found');

  await prisma.willGift.delete({ where: { id: willGiftId } });
  return { id: willGiftId, deleted: true };
};

// ========== PET CARETAKER SERVICES ==========

// ========== PET CARETAKER SERVICES ==========

// Get all pets for the user
const getUserPets = async (userId: string) => {
  const pets = await prisma.people.findMany({
    where: {
      userId,
      relationType: 'PET',
    },
    select: {
      id: true,
      fullName: true,
      dateOfBirth: true,
    },
  });

  return pets;
};

// Add caretaker to ALL pets at once
const addPetCaretaker = async (userId: string, payload: IAddPetCaretaker) => {
  const will = await prisma.will.findUnique({ where: { userId } });
  if (!will) throw new ApiError(httpStatus.NOT_FOUND, 'Will not found');

  // Validate caretaker exists and belongs to user
  const caretaker = await prisma.people.findFirst({
    where: { id: payload.caretakerId, userId },
  });

  if (!caretaker) throw new ApiError(httpStatus.NOT_FOUND, 'Caretaker not found');

  // Get all user's pets
  const pets = await getUserPets(userId);

  if (pets.length === 0) {
    throw new ApiError(httpStatus.NOT_FOUND, 'No pets found. Please add pets first.');
  }

  // Delete existing pet caretakers for all pets (replace all)
  await prisma.petCaretaker.deleteMany({
    where: {
      willId: will.id,
      petId: { in: pets.map(pet => pet.id) },
    },
  });

  // Create caretaker for each pet
  const createdCaretakers = await prisma.$transaction(
    pets.map((pet, index) =>
      prisma.petCaretaker.create({
        data: {
          willId: will.id,
          petId: pet.id,
          caretakerId: payload.caretakerId,
          cashAllocation: payload.cashAllocation,
          notes: payload.notes,
          order: index + 1,
        },
        include: {
          pet: {
            select: { id: true, fullName: true },
          },
          caretaker: {
            select: { id: true, fullName: true, email: true, relationType: true },
          },
        },
      })
    )
  );

  return {
    // message: `Caretaker assigned to ${pets.length} pet(s)`,
    // caretaker: {
    //   id: caretaker.id,
    //   fullName: caretaker.fullName,
    //   email: caretaker.email,
    //   relationType: caretaker.relationType,
    // },
    // pets: pets.map(pet => ({
    //   id: pet.id,
    //   fullName: pet.fullName,
    // })),
    petCaretakers: createdCaretakers,
    totalPets: pets.length,
    cashAllocation: payload.cashAllocation || null,
    notes: payload.notes || null,
  };
};

// Update pet caretaker (updates all pets' caretakers if caretakerId changed)
const updatePetCaretaker = async (userId: string, payload: IUpdatePetCaretaker) => {
  const will = await prisma.will.findUnique({ where: { userId } });
  if (!will) throw new ApiError(httpStatus.NOT_FOUND, 'Will not found');

  // If changing caretaker, validate new caretaker
  if (payload.caretakerId) {
    const newCaretaker = await prisma.people.findFirst({
      where: { id: payload.caretakerId, userId },
    });
    if (!newCaretaker) throw new ApiError(httpStatus.NOT_FOUND, 'New caretaker not found');
  }

  // Get all current pet caretakers for this will
  const existingCaretakers = await prisma.petCaretaker.findMany({
    where: { willId: will.id },
  });

  if (existingCaretakers.length === 0) {
    throw new ApiError(httpStatus.NOT_FOUND, 'No pet caretakers found');
  }

  // Update all pet caretakers with new data
  const updatedCaretakers = await prisma.$transaction(
    existingCaretakers.map(pc =>
      prisma.petCaretaker.update({
        where: { id: pc.id },
        data: {
          caretakerId: payload.caretakerId || pc.caretakerId,
          cashAllocation: payload.cashAllocation !== undefined ? payload.cashAllocation : pc.cashAllocation,
          notes: payload.notes !== undefined ? payload.notes : pc.notes,
        },
        include: {
          pet: {
            select: { id: true, fullName: true },
          },
          caretaker: {
            select: { id: true, fullName: true, email: true, relationType: true },
          },
        },
      })
    )
  );

  return {
    // message: `Updated ${updatedCaretakers.length} pet caretaker(s)`,
    petCaretakers: updatedCaretakers,
  };
};

// Delete all pet caretakers for the user
const deletePetCaretaker = async (userId: string) => {
  const will = await prisma.will.findUnique({ where: { userId } });
  if (!will) throw new ApiError(httpStatus.NOT_FOUND, 'Will not found');

  const deletedCaretakers = await prisma.petCaretaker.findMany({
    where: { willId: will.id },
  });

  if (deletedCaretakers.length === 0) {
    throw new ApiError(httpStatus.NOT_FOUND, 'No pet caretakers found');
  }

  await prisma.petCaretaker.deleteMany({
    where: { willId: will.id },
  });

  return {
    message: `Deleted ${deletedCaretakers.length} pet caretaker(s)`,
    deleted: true,
    count: deletedCaretakers.length,
  };
};

// Get all pet caretakers with details
const getPetCaretakers = async (userId: string) => {
  const will = await prisma.will.findUnique({ where: { userId } });
  if (!will) throw new ApiError(httpStatus.NOT_FOUND, 'Will not found');

  const petCaretakers = await prisma.petCaretaker.findMany({
    where: { willId: will.id },
    include: {
      pet: {
        select: { id: true, fullName: true, dateOfBirth: true },
      },
      caretaker: {
        select: { id: true, fullName: true, email: true, relationType: true },
      },
    },
    orderBy: { order: 'asc' },
  });

  // Group by caretaker for summary
  const caretakerSummary = petCaretakers.reduce((summary: any, pc) => {
    const key = pc.caretaker.id;
    if (!summary[key]) {
      summary[key] = {
        caretaker: pc.caretaker,
        pets: [],
        totalCashAllocation: 0,
        notes: pc.notes,
      };
    }
    summary[key].pets.push({
      id: pc.pet.id,
      fullName: pc.pet.fullName,
    });
    summary[key].totalCashAllocation += pc.cashAllocation || 0;
    return summary;
  }, {});

  return {
    petCaretakers,
    summary: Object.values(caretakerSummary),
    totalPets: petCaretakers.length,
  };
};

const getDashboard = async (userId: string) => {
  // 1. Get user's basic info + family members
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { fullName: true, profileImage: true }
  });

  const family = await prisma.people.findMany({
    where: { userId },
    orderBy: { createdAt: 'asc' }
  });

  // 2. Get will and related data
  const will = await prisma.will.findUnique({
    where: { userId },
    include: {
      executors: {
        include: {
          person: true,
          backupPerson: true
        }
      },
      estateDistributions: {
        include: {
          person: true,
          backupDistributors: { include: { person: true } }
        }
      },
      willGifts: {
        include: {
          gift: {
            include: {
              recipients: { include: { recipient: true } }
            }
          }
        }
      },
      petCaretakers: {
        include: {
          pet: true,
          caretaker: true
        }
      }
    }
  });

  // 3. Assets grouped by type
  const allAssets = await prisma.asset.findMany({ where: { userId } });
  // const financialAssets = allAssets.filter(a => 
  //   ['BANK_ACCOUNT', 'INVESTMENT_ACCOUNT', 'RETIREMENT_ACCOUNT', 'INSURANCE_PLAN', 'CRYPTO'].includes(a.type)
  // );
  // const otherAssets = allAssets.filter(a => 
  //   ['BUSINESS_INTEREST', 'SAFE_DEPOSIT_BOX'].includes(a.type)
  // );

  const financialAssets = await prisma.asset.findMany({
    where: {
      userId,
      type: {
        in: [
          "BANK_ACCOUNT",
          "INVESTMENT_ACCOUNT",
          "BUSINESS_INTEREST",
          "RETIREMENT_ACCOUNT",
          "INSURANCE_PLAN",
          "SAFE_DEPOSIT_BOX",
          "CRYPTO"
        ]
      }
    }
  });

  // const otherAssets = await prisma.asset.findMany({
  //   where: {
  //     userId,
  //     type: {
  //       in: [
  //         'BUSINESS_INTEREST',
  //         'SAFE_DEPOSIT_BOX'
  //       ]
  //     }
  //   }
  // });

  const properties = await prisma.property.findMany({ where: { userId } });
  const loans = await prisma.loan.findMany({ where: { userId } });

  // 4. Compute total estate value (approx)
  const totalFinancial = financialAssets.reduce((sum, a) => sum + (a.approximateValue || 0), 0);
  const totalProperties = properties.reduce((sum, p) => sum + p.estimatedValue, 0);
  // const totalOther = otherAssets.reduce((sum, a) => sum + (a.approximateValue || 0), 0);
  const totalLoansGiven = loans.filter(l => l.type === 'GIVEN').reduce((sum, l) => sum + l.approximateBalance, 0);
  const totalOutstanding = loans.filter(l => l.type === 'OUTSTANDING').reduce((sum, l) => sum + l.approximateBalance, 0);

  const netWorth = totalFinancial + totalProperties + 
  // totalOther + 
  totalLoansGiven - totalOutstanding;

  return {
    user: { name: user?.fullName, profileImage: user?.profileImage },
    family,
    executors: will?.executors || [],
    estateDistributions: will?.estateDistributions || [],
    gifts: will?.willGifts.map(wg => ({
      id: wg.id,
      recipientName: wg.gift.recipients[0]?.recipient.fullName,
      giftType: wg.gift.giftType,
      amount: wg.gift.amount,
      description: wg.gift.description
    })) || [],
    petCaretakers: will?.petCaretakers || [],
    assets: {
      financialAssets,
      properties,
      // otherAssets,
      loans
    },
    summary: {
      totalFinancial,
      totalProperties,
      // totalOther,
      totalLoansGiven,
      totalOutstanding,
      netWorth
    }
  };
};


export const WillServices = {
  createWill,
  getMyWill,
  getFullWill,
  updateWillStatus,
  updateWillStep,
  addExecutor,
  updateExecutor,
  deleteExecutor,
  removePersonFromExecutor,
  deleteEstateDistribution,
  addWillGift,
  deleteWillGift,
  getPetCaretakers,
  addPetCaretaker,
  updatePetCaretaker,
  deletePetCaretaker,
  getAllDistributions,
  updateBackupDistributor,
  deleteBackupDistributor,
  addDistributions,
  bulkUpdateDistributions,
  addBackupDistributor,
  getDashboard,

};