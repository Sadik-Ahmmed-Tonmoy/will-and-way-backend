import { NextFunction, Request, Response } from 'express';

import { Secret } from 'jsonwebtoken';
import config from '../../config';

import httpStatus from 'http-status';
import ApiError from '../../errors/ApiErrors';
import { jwtHelpers } from '../../helpars/jwtHelpers';
import prisma from '../../shared/prisma';
import { MyUser } from '../../interfaces';
import { UserStatus } from '@prisma/client';

//  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN)

const auth = (...roles: string[]) => {
  return async (
    req: Request & { user?: any },
    res: Response,
    next: NextFunction,
  ) => {
    try {
       const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw new ApiError(httpStatus.UNAUTHORIZED, "Verify token needed");
      }

      const token = authHeader.split(" ")[1];


      if (!token) {
        if (req.headers.accept === "text/event-stream") {
          res.writeHead(httpStatus.UNAUTHORIZED, {
            "Content-Type": "text/event-stream",
            Connection: "close",
          });
          res.write(
            `event: error\ndata: ${JSON.stringify({
              message: "User not found!",
            })}\n\n`
          );
          res.end();
          return;
        }
        throw new ApiError(httpStatus.UNAUTHORIZED, "You are not authorized!");
      }

      const verifiedUser = jwtHelpers.verifyToken(
        token,
        config.jwt.access_secret as Secret,
      );

      const user = await prisma.user.findUnique({
        where: {
          id: verifiedUser.id,
        },
      });

      if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, 'This user is not found !');
      }

      const userStatus = user?.status;

      if (userStatus === UserStatus.BLOCKED) {
        throw new ApiError(httpStatus.FORBIDDEN, 'This user is blocked !');
      }
      if (user.status === UserStatus.BLOCKED) {
        throw new ApiError(httpStatus.UNAUTHORIZED, 'You are Blocked!');
      }

      if (!user.isVerified) {
        throw new ApiError(httpStatus.UNAUTHORIZED, 'You are not verified!');
      }

      if (roles.length && !roles.includes(verifiedUser.role)) {
        throw new ApiError(httpStatus.FORBIDDEN,           "Forbidden! You are not authorized");
      }

      req.user = verifiedUser as MyUser;

      next();
    } catch (err) {
      console.log(err);
      next(err);
    }
  };
};

export default auth;
