import express, { Application } from 'express';
import { JwtPayload } from 'jsonwebtoken';
import { MyUser } from '../../interfaces';

declare global {
  namespace Express {
    interface Request {
      user: MyUser;
    }
  }
}