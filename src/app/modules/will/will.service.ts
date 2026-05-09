import { WillStatus } from '@prisma/client';
import httpStatus from 'http-status';
import ApiError from '../../../errors/ApiErrors';
import prisma from '../../../shared/prisma';
import {
  IUpdateWillStep,
  IAddExecutor,
  IUpdateExecutor,
  IAddEstateDistribution,
  IUpdateEstateDistribution,
  IAddWillGift,
  IAddPetCaretaker,
  IUpdatePetCaretaker,
} from './will.interface';

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
          gift: true,
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

const addEstateDistribution = async (userId: string, payload: IAddEstateDistribution) => {
  const will = await prisma.will.findUnique({ where: { userId } });
  if (!will) throw new ApiError(httpStatus.NOT_FOUND, 'Will not found');

  const currentDistributions = await prisma.estateDistribution.findMany({ where: { willId: will.id } });
  const currentTotal = currentDistributions.reduce((sum, d) => sum + d.percentage, 0);
  if (currentTotal + payload.percentage > 100) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Total distribution percentage cannot exceed 100%');
  }

  if (payload.peopleId) {
    const person = await prisma.people.findFirst({ where: { id: payload.peopleId, userId } });
    if (!person) throw new ApiError(httpStatus.NOT_FOUND, 'Person not found');
  }

  return prisma.estateDistribution.create({
    data: {
      willId: will.id,
      peopleId: payload.peopleId,
      charityName: payload.charityName,
      charityUEN: payload.charityUEN,
      percentage: payload.percentage,
      distributionType: payload.distributionType,
      notes: payload.notes,
    },
    include: {
      person: { select: { id: true, fullName: true, email: true } },
    },
  });
};

const updateEstateDistribution = async (userId: string, distributionId: string, payload: IUpdateEstateDistribution) => {
  const will = await prisma.will.findUnique({ where: { userId } });
  if (!will) throw new ApiError(httpStatus.NOT_FOUND, 'Will not found');

  const distribution = await prisma.estateDistribution.findFirst({ where: { id: distributionId, willId: will.id } });
  if (!distribution) throw new ApiError(httpStatus.NOT_FOUND, 'Distribution not found');

  if (payload.peopleId) {
    const person = await prisma.people.findFirst({ where: { id: payload.peopleId, userId } });
    if (!person) throw new ApiError(httpStatus.NOT_FOUND, 'Person not found');
  }

  return prisma.estateDistribution.update({
    where: { id: distributionId },
    data: payload,
    include: {
      person: { select: { id: true, fullName: true, email: true } },
    },
  });
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

const addPetCaretaker = async (userId: string, payload: IAddPetCaretaker) => {
  const will = await prisma.will.findUnique({ where: { userId } });
  if (!will) throw new ApiError(httpStatus.NOT_FOUND, 'Will not found');

  const pet = await prisma.people.findFirst({ where: { id: payload.petId, userId, relationType: 'PET' } });
  if (!pet) throw new ApiError(httpStatus.NOT_FOUND, 'Pet not found');

  const caretaker = await prisma.people.findFirst({ where: { id: payload.caretakerId, userId } });
  if (!caretaker) throw new ApiError(httpStatus.NOT_FOUND, 'Caretaker not found');

  return prisma.petCaretaker.create({
    data: {
      willId: will.id,
      petId: payload.petId,
      caretakerId: payload.caretakerId,
      cashAllocation: payload.cashAllocation,
      notes: payload.notes,
    },
    include: {
      pet: { select: { id: true, fullName: true } },
      caretaker: { select: { id: true, fullName: true, email: true } },
    },
  });
};

const updatePetCaretaker = async (userId: string, caretakerId: string, payload: IUpdatePetCaretaker) => {
  const will = await prisma.will.findUnique({ where: { userId } });
  if (!will) throw new ApiError(httpStatus.NOT_FOUND, 'Will not found');

  const petCaretaker = await prisma.petCaretaker.findFirst({ where: { id: caretakerId, willId: will.id } });
  if (!petCaretaker) throw new ApiError(httpStatus.NOT_FOUND, 'Pet caretaker not found');

  if (payload.caretakerId) {
    const caretaker = await prisma.people.findFirst({ where: { id: payload.caretakerId, userId } });
    if (!caretaker) throw new ApiError(httpStatus.NOT_FOUND, 'Caretaker not found');
  }

  return prisma.petCaretaker.update({
    where: { id: caretakerId },
    data: payload,
    include: {
      pet: { select: { id: true, fullName: true } },
      caretaker: { select: { id: true, fullName: true, email: true } },
    },
  });
};

const deletePetCaretaker = async (userId: string, caretakerId: string) => {
  const will = await prisma.will.findUnique({ where: { userId } });
  if (!will) throw new ApiError(httpStatus.NOT_FOUND, 'Will not found');

  const petCaretaker = await prisma.petCaretaker.findFirst({ where: { id: caretakerId, willId: will.id } });
  if (!petCaretaker) throw new ApiError(httpStatus.NOT_FOUND, 'Pet caretaker not found');

  await prisma.petCaretaker.delete({ where: { id: caretakerId } });
  return { id: caretakerId, deleted: true };
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
  addEstateDistribution,
  updateEstateDistribution,
  deleteEstateDistribution,
  addWillGift,
  deleteWillGift,
  addPetCaretaker,
  updatePetCaretaker,
  deletePetCaretaker,
};