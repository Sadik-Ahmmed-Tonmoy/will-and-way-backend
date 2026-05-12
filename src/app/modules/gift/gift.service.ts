import { GiftType } from '@prisma/client';
import httpStatus from 'http-status';
import ApiError from '../../../errors/ApiErrors';
import prisma from '../../../shared/prisma';
import { ICreateGift, IRecipient, IUpdateGift } from './gift.interface';
import { calculateAutoPercentages } from '../../utils/calculateAutoPercentages';

// CREATE GIFT
const createGift = async (userId: string, payload: ICreateGift) => {
  // const user = await prisma.user.findUnique({ where: { id: userId } });
  // if (!user) {
  //   throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  // }
let persons = [];
  // Validate all recipients exist and belong to user
  for (const recipient of payload.recipients) {
    const person = await prisma.people.findFirst({
      where: {
        id: recipient.peopleId,
        userId,
      },
      select:{
        id: true,
        relationType: true,
      }
    });

    if (!person) {
      throw new ApiError(
        httpStatus.NOT_FOUND,
        `Person with ID ${recipient.peopleId} not found`
      );
    }
    persons.push(person);
  }

  console.log("ssssssssssssssssssssssssssssssssssss", persons);
  // Create gift with recipients in transaction
  const result = await prisma.$transaction(async (tx) => {
    // Create the gift
    const gift = await tx.gift.create({
      data: {
        userId,
        giftType: payload.giftType,
        amount: payload.amount,
        itemName: payload.itemName,
        description: payload.description,
        vehicleDetails: payload.vehicleDetails,
        propertyAddress: payload.propertyAddress,
        financialAccountDetails: payload.financialAccountDetails,
        personalMessage: payload.personalMessage,
        recipients: {
          create: persons?.map((recipient: any) => ({
            peopleID: recipient.id,
            relation: recipient.relationType,
            percentage: calculateAutoPercentages(payload.recipients.length),
          })),
        },
      },
      include: {
        recipients: {
          include: {
            recipient: {
              select: {
                id: true,
                fullName: true,
                email: true,
                relationType: true,
                relationWithUser: true,
              },
            },
          },
        },
      },
    });

    return gift;
  });
   
  const will = await prisma.will.findUnique({ where: { userId } });
  if (!will) throw new ApiError(httpStatus.NOT_FOUND, 'Will not found');

    const existing = await prisma.willGift.findFirst({ where: { willId: will.id, giftId: result.id } });
  if (existing) throw new ApiError(httpStatus.BAD_REQUEST, 'Gift already added to will');

  const willGift = await prisma.willGift.create({
    data: {
      willId: will.id,
      giftId: result.id,
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


  return willGift;
};

// GET ALL GIFTS FOR USER
const getGifts = async (userId: string) => {
  const gifts = await prisma.gift.findMany({
    where: { userId },
    include: {
      recipients: {
        include: {
          recipient: {
            select: {
              id: true,
              fullName: true,
              email: true,
              relationWithUser: true,
              relationType: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return gifts;
};

// GET GIFT BY ID
const getGiftById = async (userId: string, giftId: string) => {
  const gift = await prisma.gift.findFirst({
    where: {
      id: giftId,
      userId,
    },
    include: {
      recipients: {
        include: {
          recipient: {
            select: {
              id: true,
              fullName: true,
              email: true,
              dateOfBirth: true,
              relationWithUser: true,
              relationType: true,
              typeOfIdentifier: true,
              identifierValue: true,
            },
          },
        },
      },
    },
  });

  if (!gift) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Gift not found');
  }

  return gift;
};

// GET GIFTS BY TYPE
const getGiftsByType = async (userId: string, giftType: GiftType) => {
  const gifts = await prisma.gift.findMany({
    where: {
      userId,
      giftType,
    },
    include: {
      recipients: {
        include: {
          recipient: {
            select: {
              id: true,
              fullName: true,
              email: true,
              relationType: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return gifts;
};

// UPDATE GIFT
const updateGift = async (userId: string, giftId: string, payload: IUpdateGift) => {
  // Check if gift exists and belongs to user
  const gift = await prisma.gift.findFirst({
    where: {
      id: giftId,
      userId,
    },
  });

  if (!gift) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Gift not found');
  }

  const result = await prisma.$transaction(async (tx) => {
    // Update gift details
    const updatedGift = await tx.gift.update({
      where: { id: giftId },
      data: {
        amount: payload.amount,
        itemName: payload.itemName,
        description: payload.description,
        vehicleDetails: payload.vehicleDetails,
        propertyAddress: payload.propertyAddress,
        financialAccountDetails: payload.financialAccountDetails,
        personalMessage: payload.personalMessage,
      },
    });

    // If recipients are provided, update them
    if (payload.recipients && payload.recipients.length > 0) {
      // Delete existing recipients
      await tx.giftRecipient.deleteMany({
        where: { giftId },
      });

      // Validate new recipients
      for (const recipient of payload.recipients) {
        const person = await prisma.people.findFirst({
          where: {
            id: recipient.peopleId,
            userId,
          },
        });

        if (!person) {
          throw new ApiError(
            httpStatus.NOT_FOUND,
            `Person with ID ${recipient.peopleId} not found`
          );
        }
      }

      // Create new recipients
      await tx.giftRecipient.createMany({
        data: payload.recipients.map((recipient : any) => ({
          giftId,
          peopleID: recipient.peopleId,
          relation: recipient.relation,
          percentage: recipient.percentage,
        })),
      });
    }

    // Return updated gift with recipients
    return tx.gift.findUnique({
      where: { id: giftId },
      include: {
        recipients: {
          include: {
            recipient: {
              select: {
                id: true,
                fullName: true,
                email: true,
                relationType: true,
              },
            },
          },
        },
      },
    });
  });

  return result;
};

// DELETE GIFT
const deleteGift = async (userId: string, giftId: string) => {
  // Check if gift exists and belongs to user
  const gift = await prisma.gift.findFirst({
    where: {
      id: giftId,
      userId,
    },
  });

  if (!gift) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Gift not found');
  }

  // Delete gift and its recipients (cascade is handled by Prisma if set up)
  await prisma.gift.delete({
    where: { id: giftId },
  });

  return { id: giftId, deleted: true };
};

export const GiftServices = {
  createGift,
  getGifts,
  getGiftById,
  getGiftsByType,
  updateGift,
  deleteGift,
};