import { People, RelationType, WillStatus } from '@prisma/client';
import httpStatus from 'http-status';
import ApiError from '../../../errors/ApiErrors';
import prisma from '../../../shared/prisma';
import { IAddPerson, IUpdatePerson, IUpdateProfile } from './user.interface';
import uploadToDigitalOcean from '../../../helpars/uploadToDigitalOcean';

// UPDATE USER PROFILE
const updateProfile = async (userId: string, payload: IUpdateProfile, files: Record<string, Express.Multer.File[]>) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  // Handle profile image upload
  const profileImageFile = files?.profileImage?.[0];
  let newProfileImageUrl: string | undefined;

  if (profileImageFile) {
    try {
      newProfileImageUrl = await uploadToDigitalOcean(profileImageFile);
    } catch (error) {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Profile image upload failed');
    }
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      ...payload,
      profileImage: newProfileImageUrl || user.profileImage,
      isProfileCompleted: true,
    },
    select: {
      id: true,
      fullName: true,
      nickname: true,
      email: true,
      phoneNumber: true,
      profileImage: true,
      region: true,
      religion: true,
      maritalStatus: true,
      isProfileCompleted: true,
    },
  });

  return updatedUser;
};

// ADD ADDRESS
const addAddress = async (userId: string, country: string, streetAddress: string, unitNumber: string, postCode: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  const address = await prisma.address.create({
    data: {
      userId,
      country,
      streetAddress,
      unitNumber,
      postCode,
    },
  });

  return address;
};

// UPDATE ADDRESS
const updateAddress = async (userId: string, addressId: string, country: string, streetAddress: string, unitNumber: string, postCode: string) => {
  const address = await prisma.address.findFirst({
    where: {
      id: addressId,
      userId,
    },
  });
  if (!address) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Address not found');
  }

  const updatedAddress = await prisma.address.update({
    where: { id: addressId },
    data: {
      country,
      streetAddress,
      unitNumber,
      postCode,
    },
  });

  return updatedAddress;
};


// GET USER PROFILE
const getProfile = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      fullName: true,
      nickname: true,
      email: true,
      phoneNumber: true,
      profileImage: true,
      region: true,
      religion: true,
      maritalStatus: true,
      role: true,
      status: true,
      isVerified: true,
      isEmailVerified: true,
      isPhoneVerified: true,
      isProfileCompleted: true,
      subscriptionTier: true,
      createdAt: true,
      addresses:true,
      people: {
        select: {
          id: true,
          fullName: true,
          email: true,
          typeOfIdentifier: true,
          identifierValue: true,
          dateOfBirth: true,
          // relationWithUser: true,
          governmentIssuedId: true,
          relationType: true,
          createdAt: true,
        },
      },
      gifts: {
        select: {
          id: true,

          amount: true,
          description: true,
          financialAccountDetails: true,
          giftType: true,
          itemName: true,
          personalMessage: true,
          
          recipients:true,
        },
      },      

    },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  return user;
};

// ADD PERSON (Spouse, Partner, Child, Pet)
const addPerson = async (userId: string, payload: IAddPerson) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

    const existingWill = await prisma.will.findUnique({ where: { userId } });

    if (!existingWill) {
      await prisma.will.create({
        data: {
          userId,
          status: WillStatus.DRAFT
        },
      });
    }


  
  // Prepare data object with required fields
  const data: any = {
    userId,
    fullName: payload.fullName,
    relationType: payload.relationType,
  };

  // Handle optional fields - only add if they exist
  if (payload.email !== undefined && payload.email !== null) {
    data.email = payload.email;
  }
  
  if (payload.relationWithUser !== undefined && payload.relationWithUser !== null) {
    data.relationWithUser = payload.relationWithUser;
  }
  
  if (payload.dateOfBirth !== undefined && payload.dateOfBirth !== null) {
    data.dateOfBirth = new Date(payload.dateOfBirth);
  }

  // Handle government ID fields
  if (payload.typeOfIdentifier !== undefined && payload.typeOfIdentifier !== null) {
    data.typeOfIdentifier = payload.typeOfIdentifier;
  }
  
  if (payload.identifierValue !== undefined && payload.identifierValue !== null) {
    data.identifierValue = payload.identifierValue;
  }

  // Set governmentIssuedId based on whether typeOfIdentifier exists
  if (data.typeOfIdentifier && data.identifierValue) {
    data.governmentIssuedId = true;
  } else if (payload.governmentIssuedId !== undefined) {
    data.governmentIssuedId = payload.governmentIssuedId;
  } else {
    data.governmentIssuedId = false;
  }

  const person = await prisma.people.create({
    data,
  });

  return person;
};

// GET ALL PEOPLE FOR USER
const getPeople = async (userId: string) => {
  const people = await prisma.people.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  return people;
};

// GET PEOPLE BY RELATION TYPE
const getPeopleByType = async (userId: string, relationType: RelationType) => {
  const people = await prisma.people.findMany({
    where: {
      userId,
      relationType,
    },
    orderBy: { createdAt: 'desc' },
  });

  return people;
};

// UPDATE PERSON
const updatePerson = async (userId: string, personId: string, payload: IUpdatePerson) => {
  const person = await prisma.people.findFirst({
    where: {
      id: personId,
      userId,
    },
  });

  if (!person) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Person not found');
  }

  const data: any = { ...payload };

  if (payload.dateOfBirth) {
    data.dateOfBirth = new Date(payload.dateOfBirth);
  }

  const updatedPerson = await prisma.people.update({
    where: { id: personId },
    data,
  });

  return updatedPerson;
};

// DELETE PERSON
const deletePerson = async (userId: string, personId: string) => {
  const person = await prisma.people.findFirst({
    where: {
      id: personId,
      userId,
    },
  });

  if (!person) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Person not found');
  }

  await prisma.people.delete({
    where: { id: personId },
  });

  return { id: personId, deleted: true };
};

export const ProfileServices = {
  updateProfile,
  addAddress,
  updateAddress,
  getProfile,
  addPerson,
  getPeople,
  getPeopleByType,
  updatePerson,
  deletePerson,
};