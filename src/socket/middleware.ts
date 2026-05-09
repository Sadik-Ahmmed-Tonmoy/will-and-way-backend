import { Socket } from 'socket.io';
import { jwtHelpers } from '../helpars/jwtHelpers';
import config from '../config';
import { Secret } from 'jsonwebtoken';
import prisma from '../shared/prisma';

export const socketAuth = async (socket: Socket, next: (err?: Error) => void) => {
  // Try to get token from auth object first (standard Socket.IO auth)
  let token = socket.handshake.auth.token;
  // If not present, try to get from headers (e.g., for Postman WebSocket)
  if (!token && socket.handshake.headers.token) {
    token = socket.handshake.headers.token as string;
  }

  if (!token) {
    console.error('Authentication error: token missing');
    return next(new Error('Authentication error: token missing'));
  }

  try {
    const decoded = jwtHelpers.verifyToken(token, config.jwt.access_secret as Secret);
    if (!decoded) throw new Error('Invalid token');
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) throw new Error('User not found');
    socket.data.user = user;
    console.log(`Socket authenticated for user ${user.id}`);
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    next(new Error('Authentication error'));
  }
};